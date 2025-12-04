'use client';

import { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import Supercluster from 'supercluster';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface Marker {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
  address?: string;
  price?: number;
  currency?: string;
  images?: string[];
  rating?: number;
  reviewsCount?: number;
}

interface MapViewProps {
  latitude: number;
  longitude: number;
  markers?: Marker[];
  zoom?: number;
  onMarkerClick?: (marker: Marker) => void;
  onZoomChange?: (zoom: number) => void;
  onImageClick?: (marker: Marker) => void;
  userLocation?: { lat: number; lng: number }; // Позиція користувача
}

export function MapView({
  latitude,
  longitude,
  markers = [],
  zoom = 12,
  onMarkerClick,
  onZoomChange,
  onImageClick,
  userLocation,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const userLocationMarkerRef = useRef<L.Marker | null>(null);
  const fullscreenRef = useRef<boolean>(false);
  const clusterZoomHandlerRef = useRef<(() => void) | null>(null);
  const fullscreenHandlersRef = useRef<{
    fullscreenchange: () => void;
    webkitfullscreenchange: () => void;
    mozfullscreenchange: () => void;
    MSFullscreenChange: () => void;
  } | null>(null);
  // const t = useTranslations('map'); // Reserved for future use

  const resolvedCenter = useMemo(() => {
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      return { lat: latitude, lng: longitude };
    }
    // Center of Europe (shifted north to show all of Europe)
    return { lat: 54.15, lng: 15.0 };
  }, [latitude, longitude]);

  const resolvedZoom = useMemo(() => {
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      return zoom;
    }
    // Zoom level to show Europe (continental view)
    return 4;
  }, [latitude, longitude, zoom]);

  // Функція для безпечної перевірки готовності карти
  const isMapReady = useMemo(() => {
    return (): boolean => {
      if (!map.current) return false;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapInstance = map.current as any;
        if (
          !mapInstance._loaded ||
          !mapInstance._container ||
          !mapInstance._panes ||
          !mapInstance._mapPane
        ) {
          return false;
        }
        const mapPane = mapInstance._mapPane;
        return !!(mapPane && mapPane._leaflet_pos);
      } catch {
        return false;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = L.map(mapContainer.current, {
      center: [resolvedCenter.lat, resolvedCenter.lng],
      zoom: resolvedZoom,
      zoomControl: false, // Вимкнути стандартні контроли, щоб додати власні
      scrollWheelZoom: false, // Вимкнути спочатку, увімкнемо після ініціалізації
      doubleClickZoom: false, // Вимкнути спочатку, увімкнемо після ініціалізації
      zoomSnap: 0, // Плавний безперервний zoom (0 = без дискретних кроків)
      zoomDelta: 0.25, // Менший крок для більш плавного zoom
      wheelPxPerZoomLevel: 120, // Більше значення = менше зміни на один прокрут (більш плавний zoom)
      inertia: true, // Плавне гальмування при переміщенні
      inertiaDeceleration: 3000, // Швидкість гальмування (більше = плавніше)
      inertiaMaxSpeed: 2000, // Максимальна швидкість переміщення
      fadeAnimation: true, // Плавна анімація зникнення
      zoomAnimation: true, // Плавна анімація zoom
      zoomAnimationThreshold: 0, // Поріг для анімації zoom (0 = завжди анімовано)
      preferCanvas: false, // Використовувати SVG для кращої якості маркерів
      attributionControl: true, // Показувати атрибуцію
    });

    // Обгорнути критичні методи Leaflet для безпечної обробки помилок
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapInstance = map.current as any;

    // Обгорнути containerPointToLatLng
    if (mapInstance.containerPointToLatLng && !mapInstance.containerPointToLatLng._wrapped) {
      const originalContainerPointToLatLng = mapInstance.containerPointToLatLng.bind(mapInstance);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mapInstance.containerPointToLatLng = function (point: any) {
        try {
          if (!this._loaded || !this._container || !this._mapPane) {
            return null;
          }
          const mapPane = this._mapPane;
          if (!mapPane || !mapPane._leaflet_pos) {
            return null;
          }
          return originalContainerPointToLatLng.call(this, point);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
          if (
            error?.message?.includes('_leaflet_pos') ||
            error?.message?.includes('Cannot read') ||
            error?.toString().includes('_leaflet_pos')
          ) {
            return null;
          }
          throw error;
        }
      };
      mapInstance.containerPointToLatLng._wrapped = true;
    }

    // Обгорнути setZoomAround
    if (mapInstance.setZoomAround && !mapInstance.setZoomAround._wrapped) {
      const originalSetZoomAround = mapInstance.setZoomAround.bind(mapInstance);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mapInstance.setZoomAround = function (latlng: any, zoom: number, options?: any) {
        try {
          if (!this._loaded || !this._container || !this._mapPane) {
            return this;
          }
          const mapPane = this._mapPane;
          if (!mapPane || !mapPane._leaflet_pos) {
            return this;
          }
          return originalSetZoomAround.call(this, latlng, zoom, options);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
          if (
            error?.message?.includes('_leaflet_pos') ||
            error?.message?.includes('Cannot read') ||
            error?.toString().includes('_leaflet_pos')
          ) {
            return this;
          }
          throw error;
        }
      };
      mapInstance.setZoomAround._wrapped = true;
    }

    // Обгорнути _getMapPanePos
    if (mapInstance._getMapPanePos && !mapInstance._getMapPanePos._wrapped) {
      const originalGetMapPanePos = mapInstance._getMapPanePos.bind(mapInstance);
      mapInstance._getMapPanePos = function () {
        try {
          if (!this._loaded || !this._container || !this._mapPane) {
            return null;
          }
          const mapPane = this._mapPane;
          if (!mapPane) {
            return null;
          }
          // Додаткова перевірка перед доступом до _leaflet_pos
          if (!mapPane._leaflet_pos) {
            // Спробуємо ініціалізувати позицію, якщо вона відсутня
            try {
              if (
                this._container &&
                this._container.offsetWidth > 0 &&
                this._container.offsetHeight > 0
              ) {
                // Карта має розміри, але позиція не ініціалізована - повертаємо null
                return null;
              }
            } catch {
              return null;
            }
            return null;
          }
          return originalGetMapPanePos.call(this);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
          if (
            error?.message?.includes('_leaflet_pos') ||
            error?.message?.includes('Cannot read') ||
            error?.toString().includes('_leaflet_pos') ||
            error?.message?.includes('undefined')
          ) {
            return null;
          }
          throw error;
        }
      };
      mapInstance._getMapPanePos._wrapped = true;
    }

    // Обгорнути getPosition для безпечної обробки
    if (mapInstance.getPosition && !mapInstance.getPosition._wrapped) {
      const originalGetPosition = mapInstance.getPosition.bind(mapInstance);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mapInstance.getPosition = function (element: any) {
        try {
          if (!element || !element._leaflet_pos) {
            return null;
          }
          return originalGetPosition.call(this, element);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
          if (
            error?.message?.includes('_leaflet_pos') ||
            error?.message?.includes('Cannot read') ||
            error?.toString().includes('_leaflet_pos') ||
            error?.message?.includes('undefined')
          ) {
            return null;
          }
          throw error;
        }
      };
      mapInstance.getPosition._wrapped = true;
    }

    // Додати кнопку fullscreen (буде додано в addControls)
    const FullscreenControl = L.Control.extend({
      onAdd: function () {
        const div = L.DomUtil.create('div', 'leaflet-control leaflet-bar');
        div.innerHTML = `
          <a href="#" role="button" aria-label="Fullscreen" style="display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; text-decoration: none; color: #333; background: white; border: 2px solid rgba(0,0,0,0.2); border-radius: 4px; box-shadow: 0 1px 5px rgba(0,0,0,0.4);">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
            </svg>
          </a>
        `;

        L.DomEvent.on(div, 'click', function (e) {
          L.DomEvent.stopPropagation(e);
          L.DomEvent.preventDefault(e);

          if (!mapContainer.current || !map.current) return;

          // Перевірка готовності карти
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mapInstance = map.current as any;
          if (!mapInstance._loaded || !mapInstance._container || !mapInstance._panes) {
            return;
          }

          if (!fullscreenRef.current) {
            // Увімкнути fullscreen
            if (mapContainer.current.requestFullscreen) {
              mapContainer.current.requestFullscreen();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } else if ((mapContainer.current as any).webkitRequestFullscreen) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (mapContainer.current as any).webkitRequestFullscreen();
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } else if ((mapContainer.current as any).mozRequestFullScreen) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (mapContainer.current as any).mozRequestFullScreen();
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } else if ((mapContainer.current as any).msRequestFullscreen) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (mapContainer.current as any).msRequestFullscreen();
            }
            fullscreenRef.current = true;
          } else {
            // Вимкнути fullscreen
            if (document.exitFullscreen) {
              document.exitFullscreen();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } else if ((document as any).webkitExitFullscreen) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (document as any).webkitExitFullscreen();
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } else if ((document as any).mozCancelFullScreen) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (document as any).mozCancelFullScreen();
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } else if ((document as any).msExitFullscreen) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (document as any).msExitFullscreen();
            }
            fullscreenRef.current = false;
          }

          // Оновити розмір карти після зміни fullscreen
          setTimeout(() => {
            if (map.current) {
              try {
                map.current.invalidateSize();
              } catch (error) {
                console.warn('Error invalidating size:', error);
              }
            }
          }, 100);
        });

        L.DomEvent.disableClickPropagation(div);

        return div;
      },
    });

    const fullscreenControl = new FullscreenControl({
      position: 'bottomright',
    });

    // Функція для додавання контролів після повної ініціалізації карти
    const addControls = () => {
      if (!map.current) return;

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapInstance = map.current as any;
        if (!mapInstance._loaded || !mapInstance._container || !mapInstance._panes) {
          return;
        }

        // Додати zoom controls справа знизу з плавним zoom
        const zoomControl = L.control.zoom({
          position: 'bottomright',
          zoomInTitle: 'Збільшити',
          zoomOutTitle: 'Зменшити',
        });
        zoomControl.addTo(map.current);

        // Налаштувати плавний zoom для кнопок zoom
        const zoomInButton = map.current.getContainer().querySelector('.leaflet-control-zoom-in');
        const zoomOutButton = map.current.getContainer().querySelector('.leaflet-control-zoom-out');

        if (zoomInButton) {
          zoomInButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (map.current && isMapReady()) {
              try {
                const currentZoom = map.current.getZoom();
                map.current.setZoom(currentZoom + 0.25, { animate: true, duration: 0.3 });
              } catch (error) {
                console.warn('Error zooming in:', error);
              }
            }
          });
        }

        if (zoomOutButton) {
          zoomOutButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (map.current && isMapReady()) {
              try {
                const currentZoom = map.current.getZoom();
                map.current.setZoom(currentZoom - 0.25, { animate: true, duration: 0.3 });
              } catch (error) {
                console.warn('Error zooming out:', error);
              }
            }
          });
        }

        fullscreenControl.addTo(map.current);

        // Чекаємо додатковий час, щоб всі DOM елементи карти були готові
        const enableZoomSafely = () => {
          if (!map.current) return false;

          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const mapInstance = map.current as any;

            // Перевірка, що всі необхідні елементи ініціалізовані
            if (
              !mapInstance._loaded ||
              !mapInstance._container ||
              !mapInstance._panes ||
              !mapInstance._mapPane
            ) {
              return false;
            }

            // Перевірка, що _mapPane має _leaflet_pos (ключовий елемент для zoom)
            const mapPane = mapInstance._mapPane;
            if (!mapPane || !mapPane._leaflet_pos) {
              return false;
            }

            // Додаткова перевірка, що контейнер має розміри
            if (!mapInstance._container.offsetWidth || !mapInstance._container.offsetHeight) {
              return false;
            }

            // Обгорнути _performZoom карти для безпечної обробки помилок при zoom
            // Дозволяємо карті працювати нормально, але обробляємо помилки
            if (mapInstance._performZoom && !mapInstance._performZoom._wrapped) {
              const originalPerformZoom = mapInstance._performZoom.bind(mapInstance);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              mapInstance._performZoom = function (center: any, zoom: number, options?: any) {
                // Перевіряємо готовність карти перед викликом
                try {
                  if (!this._loaded || !this._container || !this._mapPane) {
                    return;
                  }
                  const mapPane = this._mapPane;
                  if (!mapPane || !mapPane._leaflet_pos) {
                    // Карта ще не готова, пропускаємо операцію
                    return;
                  }
                  return originalPerformZoom.call(this, center, zoom, options);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } catch (error: any) {
                  // Перевіряємо чи це саме помилка з _leaflet_pos
                  if (
                    error?.message?.includes('_leaflet_pos') ||
                    error?.message?.includes('Cannot read') ||
                    error?.toString().includes('_leaflet_pos')
                  ) {
                    // Ігноруємо помилку під час ініціалізації
                    return;
                  }
                  throw error; // Прокидаємо інші помилки
                }
              };
              mapInstance._performZoom._wrapped = true;
            }

            // Обгорнути scrollWheelZoom handler для безпечної обробки
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const scrollWheelZoomHandler = map.current.scrollWheelZoom as any;
            if (scrollWheelZoomHandler && !scrollWheelZoomHandler._safeEnabled) {
              // Перехопити метод _onWheelScroll якщо він існує
              if (scrollWheelZoomHandler._onWheelScroll) {
                const originalOnWheelScroll =
                  scrollWheelZoomHandler._onWheelScroll.bind(scrollWheelZoomHandler);
                scrollWheelZoomHandler._onWheelScroll = function (e: WheelEvent) {
                  try {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const mapInst = this._map as any;
                    if (!mapInst || !mapInst._loaded || !mapInst._container || !mapInst._mapPane) {
                      return;
                    }
                    const mapPane = mapInst._mapPane;
                    if (!mapPane || !mapPane._leaflet_pos) {
                      return;
                    }
                    originalOnWheelScroll.call(this, e);
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  } catch (error: any) {
                    if (
                      error?.message?.includes('_leaflet_pos') ||
                      error?.message?.includes('Cannot read') ||
                      error?.toString().includes('_leaflet_pos')
                    ) {
                      // Ігноруємо помилку
                      return;
                    }
                    throw error;
                  }
                };
              }

              // Увімкнути scrollWheelZoom після повної ініціалізації
              if (map.current.scrollWheelZoom && !map.current.scrollWheelZoom.enabled()) {
                try {
                  map.current.scrollWheelZoom.enable();
                } catch (error) {
                  console.warn('Error enabling scrollWheelZoom:', error);
                }
              }
              scrollWheelZoomHandler._safeEnabled = true;
            }

            // Увімкнути doubleClickZoom після повної ініціалізації
            if (map.current.doubleClickZoom && !map.current.doubleClickZoom.enabled()) {
              try {
                map.current.doubleClickZoom.enable();
              } catch (error) {
                console.warn('Error enabling doubleClickZoom:', error);
              }
            }

            return true;
          } catch (error) {
            console.warn('Error enabling zoom:', error);
            return false;
          }
        };

        // Спробуємо увімкнути zoom з затримкою, повторюємо спробу якщо не вдалося
        let attempts = 0;
        const maxAttempts = 10;
        const tryEnableZoom = () => {
          attempts++;
          if (enableZoomSafely() || attempts >= maxAttempts) {
            return;
          }
          setTimeout(tryEnableZoom, 100);
        };

        // Починаємо спроби через 300мс
        setTimeout(tryEnableZoom, 300);
      } catch (error) {
        console.warn('Error adding controls:', error);
      }
    };

    // Чекаємо, поки карта повністю ініціалізується перед додаванням контролів
    map.current.whenReady(() => {
      if (!map.current) return;

      try {
        // Перевіряємо, що карта повністю готова
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapInstance = map.current as any;
        if (!mapInstance._loaded || !mapInstance._container || !mapInstance._panes) {
          setTimeout(() => {
            if (map.current) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const retryInstance = map.current as any;
              if (retryInstance._loaded && retryInstance._container && retryInstance._panes) {
                addControls();
              }
            }
          }, 100);
          return;
        }

        addControls();
      } catch (error) {
        console.warn('Error checking map readiness:', error);
        setTimeout(addControls, 200);
      }
    });

    // Обробка зміни fullscreen стану
    const handleFullscreenChange = () => {
      const isFullscreen = !!(
        document.fullscreenElement ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (document as any).webkitFullscreenElement ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (document as any).mozFullScreenElement ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (document as any).msFullscreenElement
      );
      fullscreenRef.current = isFullscreen;

      if (map.current) {
        setTimeout(() => {
          map.current?.invalidateSize();
        }, 100);
      }
    };

    // Зберігаємо обробник для cleanup
    fullscreenHandlersRef.current = {
      fullscreenchange: handleFullscreenChange,
      webkitfullscreenchange: handleFullscreenChange,
      mozfullscreenchange: handleFullscreenChange,
      MSFullscreenChange: handleFullscreenChange,
    };

    document.addEventListener('fullscreenchange', fullscreenHandlersRef.current.fullscreenchange);
    document.addEventListener(
      'webkitfullscreenchange',
      fullscreenHandlersRef.current.webkitfullscreenchange,
    );
    document.addEventListener(
      'mozfullscreenchange',
      fullscreenHandlersRef.current.mozfullscreenchange,
    );
    document.addEventListener(
      'MSFullscreenChange',
      fullscreenHandlersRef.current.MSFullscreenChange,
    );

    // Use OpenStreetMap tiles
    const initialTileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    const attribution =
      '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

    tileLayerRef.current = L.tileLayer(initialTileUrl, {
      attribution,
      maxZoom: 19,
      // Налаштування для плавного завантаження тайлів
      updateWhenIdle: false, // Оновлювати тайли під час руху
      updateWhenZooming: true, // Оновлювати тайли під час zoom
      keepBuffer: 2, // Зберігати більше тайлів для плавності
    }).addTo(map.current);

    // Remove "Leaflet |" from attribution text
    map.current.whenReady(() => {
      if (!map.current) return;

      // Use MutationObserver to watch for attribution changes
      const removeLeaflet = () => {
        const attributionControl = document.querySelector('.leaflet-control-attribution');
        if (attributionControl) {
          let text = attributionControl.innerHTML;
          // Remove "Leaflet |" or "Leaflet" from anywhere in the text
          text = text.replace(/Leaflet\s*\|\s*/gi, '');
          text = text.replace(/Powered by\s+Leaflet\s*\|\s*/gi, '');
          text = text.replace(/^Leaflet\s*/gi, '');
          if (attributionControl.innerHTML !== text) {
            attributionControl.innerHTML = text;
          }
        }
      };

      // Try multiple times to ensure attribution is rendered
      setTimeout(removeLeaflet, 50);
      setTimeout(removeLeaflet, 200);
      setTimeout(removeLeaflet, 500);

      // Watch for changes in attribution
      const observer = new MutationObserver(removeLeaflet);
      const attributionControl = document.querySelector('.leaflet-control-attribution');
      if (attributionControl) {
        observer.observe(attributionControl, {
          childList: true,
          subtree: true,
          characterData: true,
        });
      }
    });

    const handleZoom = () => {
      if (!map.current || !onZoomChange) return;

      try {
        // Ensure map is fully initialized before accessing zoom
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapInstance = map.current as any;
        if (!mapInstance._loaded || !mapInstance._container || !mapInstance._mapPane) return;

        // Перевірка, що _mapPane має _leaflet_pos перед доступом до zoom
        const mapPane = mapInstance._mapPane;
        if (!mapPane || !mapPane._leaflet_pos) return;

        const currentZoom = map.current.getZoom();
        if (Number.isFinite(currentZoom)) {
          onZoomChange(currentZoom);
        }
      } catch (error) {
        // Ignore zoom errors during initialization
        console.warn('Zoom error:', error);
      }
    };

    map.current.whenReady(() => {
      if (!map.current) return;

      try {
        // Викликаємо invalidateSize без перевірок, щоб карта могла ініціалізуватися
        map.current.invalidateSize();

        // Wait a bit before attaching zoom handlers to ensure map is fully ready
        setTimeout(() => {
          if (map.current) {
            // Обгорнути обробники в безпечні функції
            const safeZoomHandler = () => {
              if (isMapReady()) {
                handleZoom();
              }
            };

            map.current!.on('zoomend', safeZoomHandler);
            map.current!.on('zoom', safeZoomHandler);
          }
        }, 100);
      } catch (error) {
        console.warn('Error setting up zoom handlers:', error);
      }
    });

    return () => {
      // Видаляємо всі обробники подій перед видаленням карти
      if (map.current) {
        try {
          map.current.off(); // Видаляємо всі обробники подій
        } catch {
          // Ігноруємо помилки під час cleanup
        }
      }

      markersRef.current.forEach((marker) => {
        if (marker && map.current) {
          try {
            map.current.removeLayer(marker);
          } catch {
            // Ігноруємо помилки під час cleanup
          }
        }
      });
      markersRef.current = [];

      // Видаляємо обробники fullscreen
      if (fullscreenHandlersRef.current) {
        document.removeEventListener(
          'fullscreenchange',
          fullscreenHandlersRef.current.fullscreenchange,
        );
        document.removeEventListener(
          'webkitfullscreenchange',
          fullscreenHandlersRef.current.webkitfullscreenchange,
        );
        document.removeEventListener(
          'mozfullscreenchange',
          fullscreenHandlersRef.current.mozfullscreenchange,
        );
        document.removeEventListener(
          'MSFullscreenChange',
          fullscreenHandlersRef.current.MSFullscreenChange,
        );
        fullscreenHandlersRef.current = null;
      }

      // Видаляємо обробники zoom перед видаленням карти
      if (map.current) {
        try {
          const mapInstance = map.current as L.Map;
          mapInstance.off('zoomend');
          mapInstance.off('zoom');
        } catch {
          // Ігноруємо помилки під час cleanup
        }
      }

      // Видаляємо карту
      if (map.current) {
        try {
          const mapInstance = map.current as L.Map;
          mapInstance.remove();
        } catch {
          // Ігноруємо помилки під час cleanup
        }
        map.current = null;
      }
      tileLayerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Карта створюється тільки один раз при монтуванні

  // useEffect для оновлення view карти (тільки при ініціалізації, не при кожній зміні)
  useEffect(() => {
    if (!map.current) return;

    // Оновлюємо view тільки при першій ініціалізації, а не при кожній зміні пропсів
    const timeoutId = setTimeout(() => {
      if (!map.current) return;

      map.current.whenReady(() => {
        if (!map.current) return;

        try {
          // Перевіряємо, чи карта вже має правильний view
          const currentCenter = map.current.getCenter();
          const currentZoom = map.current.getZoom();

          const targetLat = Number.isFinite(latitude) ? latitude : resolvedCenter.lat;
          const targetLng = Number.isFinite(longitude) ? longitude : resolvedCenter.lng;
          const targetZoom =
            Number.isFinite(latitude) && Number.isFinite(longitude) ? zoom : resolvedZoom;

          // Оновлюємо view тільки якщо значення значно відрізняються
          const latDiff = Math.abs(currentCenter.lat - targetLat);
          const lngDiff = Math.abs(currentCenter.lng - targetLng);
          const zoomDiff = Math.abs(currentZoom - targetZoom);

          if (latDiff > 0.01 || lngDiff > 0.01 || zoomDiff > 0.5) {
            map.current.setView([targetLat, targetLng], targetZoom, {
              animate: false, // Без анімації при ініціалізації
              duration: 0.5,
            });
          }

          setTimeout(() => {
            if (map.current && isMapReady()) {
              try {
                map.current.invalidateSize();
              } catch (error) {
                console.warn('Error invalidating size:', error);
              }
            }
          }, 100);
        } catch (error) {
          // Ignore errors during map initialization
          console.warn('Map view update error:', error);
        }
      });
    }, 500); // Затримка для уникнення частого оновлення

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Тільки при монтуванні компонента

  // useEffect для додавання маркера позиції користувача
  useEffect(() => {
    if (!map.current || !userLocation) return;

    map.current.whenReady(() => {
      if (!map.current || !isMapReady()) return;

      try {
        // Видаляємо старий маркер позиції користувача, якщо він існує
        if (userLocationMarkerRef.current && map.current) {
          map.current.removeLayer(userLocationMarkerRef.current);
          userLocationMarkerRef.current = null;
        }

        // Створюємо іконку для позиції користувача (оранжево-червоний маркер людини)
        const userIcon = L.divIcon({
          className: 'user-location-marker',
          html: `
            <div style="position: relative; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center;">
              <!-- Пульсуючий фон -->
              <div style="position: absolute; width: 40px; height: 40px; background: rgba(255, 87, 34, 0.3); border-radius: 50%; animation: pulse 2s infinite;"></div>
              <!-- Маркер людини -->
              <div style="position: relative; z-index: 1;">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="8" r="4" fill="#FF5722" stroke="white" stroke-width="2"/>
                  <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" fill="#FF5722" stroke="white" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </div>
            </div>
            <style>
              @keyframes pulse {
                0%, 100% { transform: scale(1); opacity: 0.7; }
                50% { transform: scale(1.3); opacity: 0.3; }
              }
            </style>
          `,
          iconSize: [50, 50],
          iconAnchor: [25, 50],
        });

        // Додаємо маркер позиції користувача
        const userMarker = L.marker([userLocation.lat, userLocation.lng], {
          icon: userIcon,
          zIndexOffset: 1000, // Вищий z-index, щоб маркер був зверху
        }).addTo(map.current);

        userLocationMarkerRef.current = userMarker;

        // Реєструємо функцію для fitBounds з HomeMapWithListings
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).fitMapBounds = (bounds: [[number, number], [number, number]]) => {
          if (map.current && isMapReady()) {
            try {
              const boundsObj = L.latLngBounds(bounds);
              map.current.fitBounds(boundsObj, {
                padding: [50, 50], // Відступ від країв карти
                maxZoom: 15, // Максимальний zoom при fitBounds
                animate: true,
                duration: 0.8,
              });
            } catch (error) {
              console.warn('Error fitting bounds:', error);
            }
          }
        };
      } catch (error) {
        console.warn('Error adding user location marker:', error);
      }
    });

    return () => {
      if (userLocationMarkerRef.current && map.current) {
        try {
          map.current.removeLayer(userLocationMarkerRef.current);
        } catch {
          // Ігноруємо помилки при видаленні
        }
        userLocationMarkerRef.current = null;
      }
      // Очищаємо глобальну функцію при unmount (якщо userLocation стає undefined)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!userLocation && (window as any).fitMapBounds) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (window as any).fitMapBounds;
      }
    };
  }, [userLocation, isMapReady]);

  useEffect(() => {
    if (!map.current) return;

    map.current.whenReady(() => {
      if (markers.length === 0) {
        markersRef.current.forEach((marker) => {
          if (marker && map.current) {
            map.current.removeLayer(marker);
          }
        });
        markersRef.current = [];

        // Не викликаємо setView, щоб не перезавантажувати карту
        // Карта залишається в поточному стані, коли маркери видаляються
        if (map.current && isMapReady()) {
          try {
            map.current.invalidateSize();
          } catch (error) {
            console.warn('Error invalidating size:', error);
          }
        }
        return;
      }

      markersRef.current.forEach((marker) => {
        if (marker && map.current) {
          try {
            map.current.removeLayer(marker);
          } catch {
            // Ignore errors when removing markers
          }
        }
      });
      markersRef.current = [];

      const cluster = new Supercluster({
        radius: 60,
        maxZoom: 14,
      });

      const points = markers
        .filter((marker) => Number.isFinite(marker.latitude) && Number.isFinite(marker.longitude))
        .map((marker) => ({
          type: 'Feature' as const,
          properties: {
            id: marker.id,
            title: marker.title || '',
          },
          geometry: {
            type: 'Point' as const,
            coordinates: [marker.longitude, marker.latitude],
          },
        }));

      cluster.load(points);

      // Ensure map is fully initialized before accessing bounds/zoom
      if (!map.current) return;

      // Поріг зуму: нижче цього рівня показуємо тільки кластери, вище - тільки маркери
      const CLUSTER_ZOOM_THRESHOLD = 10;

      function processClusters() {
        if (!map.current) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapInst = map.current as any;
        if (!mapInst._loaded || !mapInst._container) return;

        try {
          const bounds = map.current.getBounds();
          const zoomLevel = map.current.getZoom();

          if (
            !bounds ||
            !bounds.isValid ||
            (typeof bounds.isValid === 'function' && !bounds.isValid()) ||
            !Number.isFinite(zoomLevel)
          ) {
            return;
          }

          const bbox: [number, number, number, number] = [
            bounds.getWest(),
            bounds.getSouth(),
            bounds.getEast(),
            bounds.getNorth(),
          ];

          // Якщо зум нижче порогу - показуємо тільки кластери
          // Якщо зум вище порогу - показуємо тільки індивідуальні маркери
          const useClusters = zoomLevel <= CLUSTER_ZOOM_THRESHOLD;

          let clusters;
          if (useClusters) {
            // Отримуємо кластери
            clusters = cluster.getClusters(bbox, Math.floor(zoomLevel));
          } else {
            // Отримуємо індивідуальні точки (без кластеризації)
            // Використовуємо maxZoom + 1, щоб отримати тільки індивідуальні точки
            clusters = cluster.getClusters(bbox, 20); // Високий рівень зуму для отримання індивідуальних точок
            // Фільтруємо тільки не-кластеризовані точки
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            clusters = clusters.filter((c: any) => !c.properties.cluster);
          }

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          clusters.forEach((clusterPoint: any) => {
            const [lng, lat] = clusterPoint.geometry.coordinates;

            if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
              return;
            }

            // Показуємо кластер тільки якщо використовуємо кластеризацію
            if (clusterPoint.properties.cluster && useClusters) {
              const count = clusterPoint.properties.point_count;
              const clusterIcon = L.divIcon({
                className: '',
                html: `
            <div style="position: relative; width: 54px; height: 54px; display: flex; align-items: center; justify-content: center;">
              <div style="position:absolute; inset:0; background:linear-gradient(135deg,#1d4ed8,#0ea5e9); border-radius:50%; box-shadow:0 10px 20px rgba(14,165,233,0.35);"></div>
              <div style="position:absolute; inset:6px; background:rgba(255,255,255,0.12); border-radius:50%;"></div>
              <span style="position:relative; color:#fff; font-weight:700; font-size:15px; letter-spacing:0.02em;">${count}</span>
            </div>
          `,
                iconSize: [54, 54],
                iconAnchor: [27, 27],
              });

              const marker = L.marker([lat, lng], { icon: clusterIcon })
                .addTo(map.current!)
                .on('click', () => {
                  if (!map.current) return;
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const mapInstance = map.current as any;
                  if (!mapInstance._loaded || !mapInstance._container) return;

                  try {
                    const expansionZoom = Math.min(
                      cluster.getClusterExpansionZoom(clusterPoint.id as number),
                      20,
                    );
                    // Ensure map is ready before setting view
                    map.current.setView([lat, lng], expansionZoom, {
                      animate: true,
                      duration: 0.6,
                      easeLinearity: 0.25,
                    });
                  } catch (error) {
                    console.warn('Error expanding cluster:', error);
                  }
                });

              markersRef.current.push(marker);
            } else if (!useClusters || !clusterPoint.properties.cluster) {
              // Показуємо індивідуальний маркер тільки якщо не використовуємо кластеризацію
              // або якщо це не кластер
              const markerData = markers.find((m) => m.id === clusterPoint.properties.id);
              const markerId = `marker-${clusterPoint.properties.id}`;

              // Teardrop-shaped marker with light blue color
              const markerIcon = L.divIcon({
                className: '',
                html: `
            <div style="position: relative; width: 40px; height: 50px; display: flex; align-items: center; justify-content: center;">
              <!-- Shadow/Glow effect -->
              <div style="position: absolute; bottom: -2px; left: 50%; transform: translateX(-50%); width: 30px; height: 8px; background: rgba(96, 208, 240, 0.3); border-radius: 50%; filter: blur(4px);"></div>
              
              <!-- Teardrop shape -->
              <svg width="40" height="50" viewBox="0 0 40 50" style="position: relative; z-index: 1;">
                <defs>
                  <filter id="glow-${markerId}">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <!-- Teardrop path - classic pin shape -->
                <path d="M 20 0 C 28 0 35 7 35 15 C 35 22 20 45 20 45 C 20 45 5 22 5 15 C 5 7 12 0 20 0 Z" 
                      fill="#60D0F0" 
                      stroke="rgba(96, 208, 240, 0.4)" 
                      stroke-width="1.5"
                      filter="url(#glow-${markerId})"/>
                <!-- White inner circle -->
                <circle cx="20" cy="15" r="7" fill="#FFFFFF" opacity="1"/>
              </svg>
            </div>
          `,
                iconSize: [40, 50],
                iconAnchor: [20, 50],
              });

              if (!markerData) return;

              // Create popup content
              const imageUrl = markerData.images?.[0] || '';
              const price = markerData.price || 0;
              const currency = markerData.currency || 'USD';
              const address = markerData.address || '';
              const rating = markerData.rating || 4.8;
              const reviewsCount = markerData.reviewsCount || 0;
              const title = markerData.title || '';

              const popupContent = `
              <div style="min-width: 280px; max-width: 320px; background: #0f172a; border-radius: 8px; overflow: hidden;">
                <div style="position: relative; width: 100%; height: 180px; background: #1e293b; overflow: hidden;">
                  ${
                    imageUrl
                      ? `
                    <img id="popup-img-${markerData.id}" src="${imageUrl}" alt="${title}" style="width: 100%; height: 100%; object-fit: cover; cursor: pointer; transition: transform 0.2s;" />
                  `
                      : `
                    <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 14px; background: #1e293b;">No image</div>
                  `
                  }
                </div>
                <div style="padding: 12px; background: #0f172a;">
                  <h3 style="margin: 0 0 6px 0; font-size: 18px; font-weight: 600; color: #f8fafc; line-height: 1.3;">${title}</h3>
                  ${
                    address
                      ? `<p style="margin: 0 0 8px 0; font-size: 14px; color: #cbd5e1; line-height: 1.4;">${address}</p>`
                      : ''
                  }
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                    <span style="color: #22c55e; font-size: 14px; font-weight: 500;">★ ${rating}</span>
                    <span style="color: #94a3b8; font-size: 14px;">· ${reviewsCount} reviews</span>
                  </div>
                  <p style="margin: 0; font-size: 16px; font-weight: 600; color: #f8fafc;">${price.toLocaleString()} ${currency}/m²</p>
                </div>
              </div>
            `;

              const popup = L.popup({
                maxWidth: 320,
                className: 'custom-popup',
              }).setContent(popupContent);

              const marker = L.marker([lat, lng], { icon: markerIcon })
                .addTo(map.current!)
                .bindPopup(popup, {
                  closeButton: true,
                  autoPan: true,
                  autoPanPadding: [50, 50],
                });

              // При кліку на маркер показуємо popup, але не переходимо на детальну сторінку
              // Popup відкривається автоматично через bindPopup

              // Handle image click in popup - при кліку на картинку відкриваємо CheckoutModal
              marker.on('popupopen', () => {
                // Обробник для кліку на саму картинку - відкриваємо CheckoutModal
                const popupImg = document.querySelector(
                  `#popup-img-${markerData.id}`,
                ) as HTMLElement;
                if (popupImg && onImageClick) {
                  popupImg.style.cursor = 'pointer';
                  popupImg.onmouseenter = () => {
                    popupImg.style.transform = 'scale(1.05)';
                  };
                  popupImg.onmouseleave = () => {
                    popupImg.style.transform = 'scale(1)';
                  };
                  popupImg.onclick = (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    // Відкриваємо CheckoutModal при кліку на картинку
                    onImageClick(markerData);
                    // Закриваємо popup після кліку на картинку
                    setTimeout(() => {
                      if (marker && marker.isPopupOpen()) {
                        marker.closePopup();
                      }
                    }, 100);
                  };
                }
              });

              markersRef.current.push(marker);
            }
          });

          // Don't auto-center on markers - let user control the map
          // Removed automatic fitBounds to allow user to navigate freely

          setTimeout(() => {
            if (map.current) {
              try {
                map.current.invalidateSize();
              } catch (error) {
                console.warn('Error invalidating size:', error);
              }
            }
          }, 100);
        } catch (error) {
          console.warn('Error processing clusters:', error);
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapInstance = map.current as any;
      if (!mapInstance._loaded || !mapInstance._container) {
        // Wait for map to be fully ready
        setTimeout(() => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mapInst = map.current as any;
          if (map.current && mapInst._loaded && mapInst._container) {
            processClusters();
          }
        }, 100);
        return;
      }

      try {
        processClusters();

        // Додаємо обробник зміни зуму для оновлення маркерів
        // Видаляємо старий обробник, якщо він є
        if (clusterZoomHandlerRef.current && map.current) {
          map.current.off('zoomend', clusterZoomHandlerRef.current);
          map.current.off('moveend', clusterZoomHandlerRef.current);
        }

        const handleZoomChange = () => {
          if (!map.current) return;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mapInst = map.current as any;
          if (!mapInst._loaded || !mapInst._container) return;

          // Видаляємо всі поточні маркери
          markersRef.current.forEach((marker) => {
            if (marker && map.current) {
              try {
                map.current.removeLayer(marker);
              } catch {
                // Ignore errors when removing markers
              }
            }
          });
          markersRef.current = [];

          // Оновлюємо маркери з новим рівнем зуму
          processClusters();
        };

        // Зберігаємо посилання на обробник для cleanup
        clusterZoomHandlerRef.current = handleZoomChange;

        // Додаємо нові обробники
        map.current.on('zoomend', handleZoomChange);
        map.current.on('moveend', handleZoomChange);
      } catch (error) {
        console.warn('Error processing clusters:', error);
      }
    });

    return () => {
      if (!map.current) return;

      // Видаляємо обробники зуму
      if (clusterZoomHandlerRef.current) {
        map.current.off('zoomend', clusterZoomHandlerRef.current);
        map.current.off('moveend', clusterZoomHandlerRef.current);
        clusterZoomHandlerRef.current = null;
      }

      markersRef.current.forEach((marker) => {
        if (marker && map.current) {
          map.current.removeLayer(marker);
        }
      });
      markersRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markers, onMarkerClick]); // Тільки markers та onMarkerClick, не latitude/longitude/zoom

  return (
    <div
      ref={mapContainer}
      className="w-full h-full rounded-lg"
      style={{ minHeight: '400px', zIndex: 0 }}
    />
  );
}
