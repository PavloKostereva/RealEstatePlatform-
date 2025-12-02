import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
const extendedListings = [
  {
    id: 'mock-prague-apartment',
    title: 'Centrální byt v Praze',
    description: 'Сучасна квартира в центрі Праги з видом на замок та річку Влтаву.',
    type: 'RENT' as const,
    category: 'APARTMENT' as const,
    price: 1200,
    currency: 'EUR',
    address: 'Václavské náměstí 28',
    city: 'Praha',
    country: 'Česká republika',
    latitude: 50.0755,
    longitude: 14.4378,
    area: 65,
    rooms: 2,
    images: ['https://images.unsplash.com/photo-1505691723518-36a5ac3be353'],
    amenities: ['elevator', 'balcony'],
    status: 'PUBLISHED' as const,
    createdAt: '2024-11-01T10:00:00.000Z',
    updatedAt: '2024-11-15T12:00:00.000Z',
    owner: {
      id: 'owner-prague',
      name: 'Jan Novák',
      email: 'jan@example.com',
    },
  },
  {
    id: 'mock-budapest-loft',
    title: 'Modern loft Budapest központjában',
    description: 'Loft з високими стелями та промисловим дизайном в центрі Будапешта.',
    type: 'RENT' as const,
    category: 'APARTMENT' as const,
    price: 850,
    currency: 'EUR',
    address: 'Andrássy út 15',
    city: 'Budapest',
    country: 'Magyarország',
    latitude: 47.4979,
    longitude: 19.0402,
    area: 88,
    rooms: 3,
    images: ['https://images.unsplash.com/photo-1505691938895-1758d7feb511'],
    amenities: ['elevator', 'security'],
    status: 'PUBLISHED' as const,
    createdAt: '2024-10-20T09:00:00.000Z',
    updatedAt: '2024-11-10T14:00:00.000Z',
    owner: {
      id: 'owner-budapest',
      name: 'Kovács Márta',
      email: 'marta@example.com',
    },
  },
  {
    id: 'mock-amsterdam-canal',
    title: 'Canal House in Amsterdam',
    description: "Будинок на каналі з класичним фасадом та сучасним інтер'єром.",
    type: 'SALE' as const,
    category: 'HOUSE' as const,
    price: 1250000,
    currency: 'EUR',
    address: 'Herengracht 123',
    city: 'Amsterdam',
    country: 'Nederland',
    latitude: 52.3676,
    longitude: 4.9041,
    area: 185,
    rooms: 5,
    images: ['https://images.unsplash.com/photo-1568605114967-8130f3a36994'],
    amenities: ['garden', 'parking', 'fireplace'],
    status: 'PUBLISHED' as const,
    createdAt: '2024-09-15T11:00:00.000Z',
    updatedAt: '2024-11-05T16:00:00.000Z',
    owner: {
      id: 'owner-amsterdam',
      name: 'Emma van der Berg',
      email: 'emma@example.com',
    },
  },
  {
    id: 'mock-rome-apartment',
    title: 'Appartamento nel centro storico di Roma',
    description: 'Квартира в історичному центрі з видом на Колізей та сучасним ремонтом.',
    type: 'RENT' as const,
    category: 'APARTMENT' as const,
    price: 1800,
    currency: 'EUR',
    address: 'Via dei Fori Imperiali 45',
    city: 'Roma',
    country: 'Italia',
    latitude: 41.9028,
    longitude: 12.4964,
    area: 95,
    rooms: 3,
    images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267'],
    amenities: ['elevator', 'balcony', 'security'],
    status: 'PUBLISHED' as const,
    createdAt: '2024-08-25T13:00:00.000Z',
    updatedAt: '2024-10-30T10:00:00.000Z',
    owner: {
      id: 'owner-rome',
      name: 'Marco Rossi',
      email: 'marco@example.com',
    },
  },
  {
    id: 'mock-lisbon-penthouse',
    title: 'Penthouse com vista para o Tejo',
    description: 'Пентхаус з терасою та панорамним видом на річку Тежу.',
    type: 'SALE' as const,
    category: 'APARTMENT' as const,
    price: 650000,
    currency: 'EUR',
    address: 'Avenida da Liberdade 180',
    city: 'Lisboa',
    country: 'Portugal',
    latitude: 38.7223,
    longitude: -9.1393,
    area: 135,
    rooms: 4,
    images: ['https://images.unsplash.com/photo-1505691938895-1758d7feb511'],
    amenities: ['terrace', 'pool', 'smartHome'],
    status: 'PUBLISHED' as const,
    createdAt: '2024-07-30T15:00:00.000Z',
    updatedAt: '2024-10-25T12:00:00.000Z',
    owner: {
      id: 'owner-lisbon',
      name: 'Sofia Silva',
      email: 'sofia@example.com',
    },
  },
  {
    id: 'mock-stockholm-apartment',
    title: 'Modernt lägenhet i Stockholm',
    description: 'Сучасна квартира в центрі Стокгольма з дизайнерським ремонтом.',
    type: 'RENT' as const,
    category: 'APARTMENT' as const,
    price: 2200,
    currency: 'SEK',
    address: 'Drottninggatan 42',
    city: 'Stockholm',
    country: 'Sverige',
    latitude: 59.3293,
    longitude: 18.0686,
    area: 72,
    rooms: 2,
    images: ['https://images.unsplash.com/photo-1505691723518-36a5ac3be353'],
    amenities: ['elevator', 'floorHeating'],
    status: 'PUBLISHED' as const,
    createdAt: '2024-06-18T08:00:00.000Z',
    updatedAt: '2024-10-20T11:00:00.000Z',
    owner: {
      id: 'owner-stockholm',
      name: 'Erik Andersson',
      email: 'erik@example.com',
    },
  },
  {
    id: 'mock-copenhagen-house',
    title: 'Hyggeligt hus i København',
    description: 'Затишний будинок з садом у тихому районі Копенгагена.',
    type: 'SALE' as const,
    category: 'HOUSE' as const,
    price: 3200000,
    currency: 'DKK',
    address: 'Blegdamsvej 25',
    city: 'København',
    country: 'Danmark',
    latitude: 55.6761,
    longitude: 12.5683,
    area: 195,
    rooms: 4,
    images: ['https://images.unsplash.com/photo-1568605114967-8130f3a36994'],
    amenities: ['garden', 'garage', 'fireplace'],
    status: 'PUBLISHED' as const,
    createdAt: '2024-05-22T14:00:00.000Z',
    updatedAt: '2024-10-15T09:00:00.000Z',
    owner: {
      id: 'owner-copenhagen',
      name: 'Lars Hansen',
      email: 'lars@example.com',
    },
  },
  {
    id: 'mock-oslo-apartment',
    title: 'Moderne leilighet i Oslo',
    description: "Світла квартира з видом на фіорд та сучасним інтер'єром.",
    type: 'RENT' as const,
    category: 'APARTMENT' as const,
    price: 18000,
    currency: 'NOK',
    address: 'Karl Johans gate 15',
    city: 'Oslo',
    country: 'Norge',
    latitude: 59.9139,
    longitude: 10.7522,
    area: 85,
    rooms: 3,
    images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267'],
    amenities: ['elevator', 'balcony'],
    status: 'PUBLISHED' as const,
    createdAt: '2024-04-10T10:00:00.000Z',
    updatedAt: '2024-10-10T15:00:00.000Z',
    owner: {
      id: 'owner-oslo',
      name: 'Ingrid Berg',
      email: 'ingrid@example.com',
    },
  },
  {
    id: 'mock-zurich-office',
    title: 'Bürofläche im Zentrum von Zürich',
    description: 'Офісний простір в центрі Цюриха з сучасним обладнанням.',
    type: 'RENT' as const,
    category: 'COMMERCIAL' as const,
    price: 4500,
    currency: 'CHF',
    address: 'Bahnhofstrasse 31',
    city: 'Zürich',
    country: 'Schweiz',
    latitude: 47.3769,
    longitude: 8.5417,
    area: 180,
    images: ['https://images.unsplash.com/photo-1431540015161-0bf868a2d407'],
    amenities: ['security', 'meetingRoom', 'parking'],
    status: 'PUBLISHED' as const,
    createdAt: '2024-03-05T12:00:00.000Z',
    updatedAt: '2024-10-05T13:00:00.000Z',
    owner: {
      id: 'owner-zurich',
      name: 'Thomas Müller',
      email: 'thomas@example.com',
    },
  },
  {
    id: 'mock-milan-apartment',
    title: 'Appartamento di lusso a Milano',
    description: 'Розкішна квартира в центрі Мілана з дизайнерським ремонтом.',
    type: 'SALE' as const,
    category: 'APARTMENT' as const,
    price: 980000,
    currency: 'EUR',
    address: 'Via Montenapoleone 8',
    city: 'Milano',
    country: 'Italia',
    latitude: 45.4642,
    longitude: 9.19,
    area: 125,
    rooms: 4,
    images: ['https://images.unsplash.com/photo-1505691723518-36a5ac3be353'],
    amenities: ['elevator', 'balcony', 'smartHome'],
    status: 'PUBLISHED' as const,
    createdAt: '2024-02-14T16:00:00.000Z',
    updatedAt: '2024-10-01T14:00:00.000Z',
    owner: {
      id: 'owner-milan',
      name: 'Giulia Bianchi',
      email: 'giulia@example.com',
    },
  },
  {
    id: 'mock-madrid-apartment',
    title: 'Piso moderno en el centro de Madrid',
    description: 'Сучасна квартира в центрі Мадрида з балконом та видом на парк.',
    type: 'RENT' as const,
    category: 'APARTMENT' as const,
    price: 1400,
    currency: 'EUR',
    address: 'Gran Vía 45',
    city: 'Madrid',
    country: 'España',
    latitude: 40.4168,
    longitude: -3.7038,
    area: 78,
    rooms: 2,
    images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267'],
    amenities: ['elevator', 'balcony'],
    status: 'PUBLISHED' as const,
    createdAt: '2024-01-28T11:00:00.000Z',
    updatedAt: '2024-09-28T10:00:00.000Z',
    owner: {
      id: 'owner-madrid',
      name: 'Carmen López',
      email: 'carmen@example.com',
    },
  },
  {
    id: 'mock-paris-loft',
    title: 'Loft industriel à Paris',
    description: 'Промисловий loft в Монмартрі з високими стелями та великими вікнами.',
    type: 'RENT' as const,
    category: 'APARTMENT' as const,
    price: 2800,
    currency: 'EUR',
    address: 'Rue Lepic 12',
    city: 'Paris',
    country: 'France',
    latitude: 48.8847,
    longitude: 2.3397,
    area: 110,
    rooms: 3,
    images: ['https://images.unsplash.com/photo-1505691938895-1758d7feb511'],
    amenities: ['elevator', 'security'],
    status: 'PUBLISHED' as const,
    createdAt: '2023-12-20T09:00:00.000Z',
    updatedAt: '2024-09-25T15:00:00.000Z',
    owner: {
      id: 'owner-paris',
      name: 'Sophie Martin',
      email: 'sophie@example.com',
    },
  },
  {
    id: 'mock-london-house',
    title: 'Victorian House in London',
    description: 'Вікторіанський будинок з садом у тихому районі Лондона.',
    type: 'SALE' as const,
    category: 'HOUSE' as const,
    price: 1850000,
    currency: 'GBP',
    address: 'Kensington Gardens 25',
    city: 'London',
    country: 'United Kingdom',
    latitude: 51.5074,
    longitude: -0.1278,
    area: 240,
    rooms: 6,
    images: ['https://images.unsplash.com/photo-1568605114967-8130f3a36994'],
    amenities: ['garden', 'garage', 'fireplace'],
    status: 'PUBLISHED' as const,
    createdAt: '2023-11-15T13:00:00.000Z',
    updatedAt: '2024-09-20T11:00:00.000Z',
    owner: {
      id: 'owner-london',
      name: 'James Wilson',
      email: 'james@example.com',
    },
  },
  {
    id: 'mock-dublin-apartment',
    title: 'City Centre Apartment in Dublin',
    description: 'Квартира в центрі Дубліна з видом на річку Ліффі.',
    type: 'RENT' as const,
    category: 'APARTMENT' as const,
    price: 1900,
    currency: 'EUR',
    address: 'Temple Bar 8',
    city: 'Dublin',
    country: 'Ireland',
    latitude: 53.3498,
    longitude: -6.2603,
    area: 68,
    rooms: 2,
    images: ['https://images.unsplash.com/photo-1505691723518-36a5ac3be353'],
    amenities: ['elevator'],
    status: 'PUBLISHED' as const,
    createdAt: '2023-10-08T10:00:00.000Z',
    updatedAt: '2024-09-15T12:00:00.000Z',
    owner: {
      id: 'owner-dublin',
      name: "Sean O'Brien",
      email: 'sean@example.com',
    },
  },
  {
    id: 'mock-athens-apartment',
    title: 'Ανετο διαμέρισμα στην Αθήνα',
    description: 'Зручна квартира в центрі Афін з балконом та видом на Акрополь.',
    type: 'RENT' as const,
    category: 'APARTMENT' as const,
    price: 750,
    currency: 'EUR',
    address: 'Plaka 12',
    city: 'Athens',
    country: 'Ελλάδα',
    latitude: 37.9838,
    longitude: 23.7275,
    area: 70,
    rooms: 2,
    images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267'],
    amenities: ['balcony'],
    status: 'PUBLISHED' as const,
    createdAt: '2023-09-22T14:00:00.000Z',
    updatedAt: '2024-09-10T16:00:00.000Z',
    owner: {
      id: 'owner-athens',
      name: 'Maria Papadopoulos',
      email: 'maria@example.com',
    },
  },
  {
    id: 'mock-helsinki-apartment',
    title: 'Moderni asunto Helsingissä',
    description: 'Сучасна квартира в Гельсінкі з дизайнерським ремонтом.',
    type: 'RENT' as const,
    category: 'APARTMENT' as const,
    price: 1500,
    currency: 'EUR',
    address: 'Esplanadi 15',
    city: 'Helsinki',
    country: 'Suomi',
    latitude: 60.1699,
    longitude: 24.9384,
    area: 75,
    rooms: 2,
    images: ['https://images.unsplash.com/photo-1505691723518-36a5ac3be353'],
    amenities: ['elevator', 'sauna'],
    status: 'PUBLISHED' as const,
    createdAt: '2023-08-30T08:00:00.000Z',
    updatedAt: '2024-09-05T10:00:00.000Z',
    owner: {
      id: 'owner-helsinki',
      name: 'Mika Virtanen',
      email: 'mika@example.com',
    },
  },
  {
    id: 'mock-brussels-office',
    title: 'Bureau au cœur de Bruxelles',
    description: 'Офісний простір в центрі Брюсселя з сучасним обладнанням.',
    type: 'RENT' as const,
    category: 'COMMERCIAL' as const,
    price: 3200,
    currency: 'EUR',
    address: 'Grand Place 5',
    city: 'Brussels',
    country: 'Belgium',
    latitude: 50.8503,
    longitude: 4.3517,
    area: 150,
    images: ['https://images.unsplash.com/photo-1431540015161-0bf868a2d407'],
    amenities: ['security', 'meetingRoom'],
    status: 'PUBLISHED' as const,
    createdAt: '2023-07-18T12:00:00.000Z',
    updatedAt: '2024-09-01T14:00:00.000Z',
    owner: {
      id: 'owner-brussels',
      name: 'Luc Dubois',
      email: 'luc@example.com',
    },
  },
  {
    id: 'mock-luxembourg-apartment',
    title: 'Appartement de luxe à Luxembourg',
    description: 'Розкішна квартира в центрі Люксембурга з панорамним видом.',
    type: 'SALE' as const,
    category: 'APARTMENT' as const,
    price: 1250000,
    currency: 'EUR',
    address: "Place d'Armes 10",
    city: 'Luxembourg',
    country: 'Luxembourg',
    latitude: 49.6116,
    longitude: 6.1319,
    area: 140,
    rooms: 4,
    images: ['https://images.unsplash.com/photo-1505691723518-36a5ac3be353'],
    amenities: ['elevator', 'balcony', 'smartHome'],
    status: 'PUBLISHED' as const,
    createdAt: '2023-06-25T15:00:00.000Z',
    updatedAt: '2024-08-28T11:00:00.000Z',
    owner: {
      id: 'owner-luxembourg',
      name: 'Pierre Weber',
      email: 'pierre@example.com',
    },
  },
  {
    id: 'mock-monaco-penthouse',
    title: 'Penthouse avec vue sur la mer à Monaco',
    description: 'Пентхаус з терасою та видом на море в Монако.',
    type: 'SALE' as const,
    category: 'APARTMENT' as const,
    price: 8500000,
    currency: 'EUR',
    address: 'Avenue Princesse Grace 15',
    city: 'Monaco',
    country: 'Monaco',
    latitude: 43.7384,
    longitude: 7.4246,
    area: 280,
    rooms: 5,
    images: ['https://images.unsplash.com/photo-1505691938895-1758d7feb511'],
    amenities: ['terrace', 'pool', 'smartHome', 'concierge'],
    status: 'PUBLISHED' as const,
    createdAt: '2023-05-12T17:00:00.000Z',
    updatedAt: '2024-08-25T13:00:00.000Z',
    owner: {
      id: 'owner-monaco',
      name: 'Jean-Claude Moreau',
      email: 'jean@example.com',
    },
  },
  {
    id: 'mock-geneva-apartment',
    title: 'Appartement moderne à Genève',
    description: 'Сучасна квартира в центрі Женеви з видом на озеро.',
    type: 'RENT' as const,
    category: 'APARTMENT' as const,
    price: 2500,
    currency: 'CHF',
    address: 'Rue du Rhône 42',
    city: 'Genève',
    country: 'Suisse',
    latitude: 46.2044,
    longitude: 6.1432,
    area: 90,
    rooms: 3,
    images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267'],
    amenities: ['elevator', 'balcony'],
    status: 'PUBLISHED' as const,
    createdAt: '2023-04-08T09:00:00.000Z',
    updatedAt: '2024-08-20T10:00:00.000Z',
    owner: {
      id: 'owner-geneva',
      name: 'Claire Dubois',
      email: 'claire@example.com',
    },
  },
  {
    id: 'mock-rotterdam-office',
    title: 'Kantoorruimte in Rotterdam',
    description: 'Офісний простір в центрі Роттердама з сучасним дизайном.',
    type: 'RENT' as const,
    category: 'COMMERCIAL' as const,
    price: 2800,
    currency: 'EUR',
    address: 'Coolsingel 42',
    city: 'Rotterdam',
    country: 'Nederland',
    latitude: 51.9244,
    longitude: 4.4777,
    area: 200,
    images: ['https://images.unsplash.com/photo-1431540015161-0bf868a2d407'],
    amenities: ['security', 'parking', 'meetingRoom'],
    status: 'PUBLISHED' as const,
    createdAt: '2023-03-15T11:00:00.000Z',
    updatedAt: '2024-08-15T12:00:00.000Z',
    owner: {
      id: 'owner-rotterdam',
      name: 'Willem de Vries',
      email: 'willem@example.com',
    },
  },
  {
    id: 'mock-bucharest-apartment',
    title: 'Apartament modern în centrul Bucureștiului',
    description: 'Сучасна квартира в центрі Бухареста з дизайнерським ремонтом.',
    type: 'RENT' as const,
    category: 'APARTMENT' as const,
    price: 600,
    currency: 'EUR',
    address: 'Calea Victoriei 120',
    city: 'București',
    country: 'România',
    latitude: 44.4268,
    longitude: 26.1025,
    area: 80,
    rooms: 3,
    images: ['https://images.unsplash.com/photo-1505691723518-36a5ac3be353'],
    amenities: ['elevator', 'balcony'],
    status: 'PUBLISHED' as const,
    createdAt: '2023-02-20T13:00:00.000Z',
    updatedAt: '2024-08-10T14:00:00.000Z',
    owner: {
      id: 'owner-bucharest',
      name: 'Andrei Popescu',
      email: 'andrei@example.com',
    },
  },
  {
    id: 'mock-sofia-house',
    title: 'Модерна къща в София',
    description: 'Сучасний будинок з садом у тихому районі Софії.',
    type: 'SALE' as const,
    category: 'HOUSE' as const,
    price: 280000,
    currency: 'EUR',
    address: 'бул. Витоша 15',
    city: 'София',
    country: 'България',
    latitude: 42.6977,
    longitude: 23.3219,
    area: 210,
    rooms: 5,
    images: ['https://images.unsplash.com/photo-1568605114967-8130f3a36994'],
    amenities: ['garden', 'garage', 'fireplace'],
    status: 'PUBLISHED' as const,
    createdAt: '2023-01-25T10:00:00.000Z',
    updatedAt: '2024-08-05T15:00:00.000Z',
    owner: {
      id: 'owner-sofia',
      name: 'Иван Петров',
      email: 'ivan@example.com',
    },
  },
  {
    id: 'mock-zagreb-apartment',
    title: 'Moderan stan u centru Zagreba',
    description: 'Сучасна квартира в центрі Загреба з видом на парк.',
    type: 'RENT' as const,
    category: 'APARTMENT' as const,
    price: 700,
    currency: 'EUR',
    address: 'Ilica 15',
    city: 'Zagreb',
    country: 'Hrvatska',
    latitude: 45.815,
    longitude: 15.9819,
    area: 72,
    rooms: 2,
    images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267'],
    amenities: ['elevator', 'balcony'],
    status: 'PUBLISHED' as const,
    createdAt: '2022-12-10T12:00:00.000Z',
    updatedAt: '2024-08-01T11:00:00.000Z',
    owner: {
      id: 'owner-zagreb',
      name: 'Marko Horvat',
      email: 'marko@example.com',
    },
  },
  {
    id: 'mock-bratislava-apartment',
    title: 'Moderný byt v centre Bratislavy',
    description: 'Сучасна квартира в центрі Братислави з дизайнерським ремонтом.',
    type: 'RENT' as const,
    category: 'APARTMENT' as const,
    price: 800,
    currency: 'EUR',
    address: 'Hlavná ulica 25',
    city: 'Bratislava',
    country: 'Slovensko',
    latitude: 48.1486,
    longitude: 17.1077,
    area: 68,
    rooms: 2,
    images: ['https://images.unsplash.com/photo-1505691723518-36a5ac3be353'],
    amenities: ['elevator'],
    status: 'PUBLISHED' as const,
    createdAt: '2022-11-18T14:00:00.000Z',
    updatedAt: '2024-07-28T13:00:00.000Z',
    owner: {
      id: 'owner-bratislava',
      name: 'Peter Novák',
      email: 'peter@example.com',
    },
  },
  {
    id: 'mock-tallinn-apartment',
    title: 'Kaasaegne korter Tallinna kesklinna',
    description: 'Сучасна квартира в центрі Таллінна з видом на старе місто.',
    type: 'RENT' as const,
    category: 'APARTMENT' as const,
    price: 950,
    currency: 'EUR',
    address: 'Vabaduse väljak 8',
    city: 'Tallinn',
    country: 'Eesti',
    latitude: 59.437,
    longitude: 24.7536,
    area: 75,
    rooms: 2,
    images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267'],
    amenities: ['elevator', 'balcony'],
    status: 'PUBLISHED' as const,
    createdAt: '2022-10-05T09:00:00.000Z',
    updatedAt: '2024-07-25T10:00:00.000Z',
    owner: {
      id: 'owner-tallinn',
      name: 'Märt Saar',
      email: 'mart@example.com',
    },
  },
  {
    id: 'mock-riga-apartment',
    title: 'Mūsdienīgs dzīvoklis Rīgas centrā',
    description: 'Сучасна квартира в центрі Ріги з видом на Даугаву.',
    type: 'RENT' as const,
    category: 'APARTMENT' as const,
    price: 650,
    currency: 'EUR',
    address: 'Brīvības bulvāris 25',
    city: 'Rīga',
    country: 'Latvija',
    latitude: 56.9496,
    longitude: 24.1052,
    area: 70,
    rooms: 2,
    images: ['https://images.unsplash.com/photo-1505691723518-36a5ac3be353'],
    amenities: ['elevator'],
    status: 'PUBLISHED' as const,
    createdAt: '2022-09-12T11:00:00.000Z',
    updatedAt: '2024-07-20T12:00:00.000Z',
    owner: {
      id: 'owner-riga',
      name: 'Jānis Bērziņš',
      email: 'janis@example.com',
    },
  },
  {
    id: 'mock-vilnius-apartment',
    title: 'Šiuolaikiškas butas Vilniaus centre',
    description: 'Сучасна квартира в центрі Вільнюса з дизайнерським ремонтом.',
    type: 'RENT' as const,
    category: 'APARTMENT' as const,
    price: 750,
    currency: 'EUR',
    address: 'Gedimino prospektas 15',
    city: 'Vilnius',
    country: 'Lietuva',
    latitude: 54.6872,
    longitude: 25.2797,
    area: 73,
    rooms: 2,
    images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267'],
    amenities: ['elevator', 'balcony'],
    status: 'PUBLISHED' as const,
    createdAt: '2022-08-20T15:00:00.000Z',
    updatedAt: '2024-07-15T14:00:00.000Z',
    owner: {
      id: 'owner-vilnius',
      name: 'Jonas Kazlauskas',
      email: 'jonas@example.com',
    },
  },
  {
    id: 'mock-warsaw-office-2',
    title: 'Biuro w centrum Warszawy',
    description: 'Офісний простір в центрі Варшави з сучасним обладнанням.',
    type: 'RENT' as const,
    category: 'COMMERCIAL' as const,
    price: 3500,
    currency: 'PLN',
    address: 'ul. Nowy Świat 15',
    city: 'Warszawa',
    country: 'Polska',
    latitude: 52.2297,
    longitude: 21.0122,
    area: 160,
    images: ['https://images.unsplash.com/photo-1431540015161-0bf868a2d407'],
    amenities: ['security', 'parking', 'meetingRoom'],
    status: 'PUBLISHED' as const,
    createdAt: '2022-07-28T10:00:00.000Z',
    updatedAt: '2024-07-10T11:00:00.000Z',
    owner: {
      id: 'owner-warsaw-2',
      name: 'Anna Nowak',
      email: 'anna2@example.com',
    },
  },
  {
    id: 'mock-krakow-apartment',
    title: 'Mieszkanie w centrum Krakowa',
    description: 'Квартира в центрі Кракова з видом на ринок та сучасним ремонтом.',
    type: 'RENT' as const,
    category: 'APARTMENT' as const,
    price: 1100,
    currency: 'PLN',
    address: 'Rynek Główny 25',
    city: 'Kraków',
    country: 'Polska',
    latitude: 50.0647,
    longitude: 19.945,
    area: 82,
    rooms: 3,
    images: ['https://images.unsplash.com/photo-1505691723518-36a5ac3be353'],
    amenities: ['elevator', 'balcony'],
    status: 'PUBLISHED' as const,
    createdAt: '2022-06-15T13:00:00.000Z',
    updatedAt: '2024-07-05T15:00:00.000Z',
    owner: {
      id: 'owner-krakow',
      name: 'Piotr Kowalski',
      email: 'piotr@example.com',
    },
  },
  {
    id: 'mock-odessa-apartment',
    title: 'Сучасна квартира в Одесі',
    description: 'Квартира в центрі Одеси з видом на море та сучасним ремонтом.',
    type: 'RENT' as const,
    category: 'APARTMENT' as const,
    price: 450,
    currency: 'USD',
    address: 'Приморський бульвар, 15',
    city: 'Одеса',
    country: 'Україна',
    latitude: 46.4825,
    longitude: 30.7233,
    area: 65,
    rooms: 2,
    images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267'],
    amenities: ['elevator', 'balcony'],
    status: 'PUBLISHED' as const,
    createdAt: '2022-05-22T08:00:00.000Z',
    updatedAt: '2024-07-01T09:00:00.000Z',
    owner: {
      id: 'owner-odessa',
      name: 'Олександр Морозов',
      email: 'oleksandr@example.com',
    },
  },
  {
    id: 'mock-kharkiv-apartment',
    title: 'Квартира в центрі Харкова',
    description: 'Світла квартира в центрі Харкова з дизайнерським ремонтом.',
    type: 'RENT' as const,
    category: 'APARTMENT' as const,
    price: 380,
    currency: 'USD',
    address: 'проспект Науки, 25',
    city: 'Харків',
    country: 'Україна',
    latitude: 49.9935,
    longitude: 36.2304,
    area: 70,
    rooms: 2,
    images: ['https://images.unsplash.com/photo-1505691723518-36a5ac3be353'],
    amenities: ['elevator'],
    status: 'PUBLISHED' as const,
    createdAt: '2022-04-10T12:00:00.000Z',
    updatedAt: '2024-06-28T10:00:00.000Z',
    owner: {
      id: 'owner-kharkiv',
      name: 'Віктор Семенов',
      email: 'viktor@example.com',
    },
  },
  {
    id: 'mock-dnipro-apartment',
    title: 'Квартира в Дніпрі',
    description: 'Сучасна квартира в центрі Дніпра з видом на Дніпро.',
    type: 'RENT' as const,
    category: 'APARTMENT' as const,
    price: 350,
    currency: 'USD',
    address: 'проспект Дмитра Яворницького, 45',
    city: 'Дніпро',
    country: 'Україна',
    latitude: 48.4647,
    longitude: 35.0462,
    area: 68,
    rooms: 2,
    images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267'],
    amenities: ['elevator', 'balcony'],
    status: 'PUBLISHED' as const,
    createdAt: '2022-03-18T14:00:00.000Z',
    updatedAt: '2024-06-25T11:00:00.000Z',
    owner: {
      id: 'owner-dnipro',
      name: 'Сергій Коваленко',
      email: 'serhii@example.com',
    },
  },
  {
    id: 'mock-lviv-apartment-2',
    title: 'Квартира в історичному центрі Львова',
    description: 'Квартира в старовинному будинку в центрі Львова з високими стелями.',
    type: 'RENT' as const,
    category: 'APARTMENT' as const,
    price: 420,
    currency: 'USD',
    address: 'вул. Грушевського, 8',
    city: 'Львів',
    country: 'Україна',
    latitude: 49.8397,
    longitude: 24.0297,
    area: 75,
    rooms: 3,
    images: ['https://images.unsplash.com/photo-1505691723518-36a5ac3be353'],
    amenities: ['elevator', 'balcony'],
    status: 'PUBLISHED' as const,
    createdAt: '2022-02-25T10:00:00.000Z',
    updatedAt: '2024-06-20T13:00:00.000Z',
    owner: {
      id: 'owner-lviv-2',
      name: 'Наталія Григоренко',
      email: 'natalia@example.com',
    },
  },
  {
    id: 'mock-kyiv-apartment-2',
    title: 'Квартира в Печерську, Київ',
    description: 'Елітна квартира в престижному районі Києва з панорамним видом.',
    type: 'SALE' as const,
    category: 'APARTMENT' as const,
    price: 185000,
    currency: 'USD',
    address: 'вул. Печерська, 25',
    city: 'Київ',
    country: 'Україна',
    latitude: 50.428,
    longitude: 30.5291,
    area: 120,
    rooms: 4,
    images: ['https://images.unsplash.com/photo-1505691723518-36a5ac3be353'],
    amenities: ['elevator', 'balcony', 'parking', 'smartHome'],
    status: 'PUBLISHED' as const,
    createdAt: '2022-01-30T15:00:00.000Z',
    updatedAt: '2024-06-15T14:00:00.000Z',
    owner: {
      id: 'owner-kyiv-2',
      name: 'Дмитро Шевченко',
      email: 'dmitro@example.com',
    },
  },
  {
    id: 'mock-kyiv-office',
    title: 'Офісний простір в центрі Києва',
    description: 'Сучасний офісний простір з meeting rooms та open-space зоною.',
    type: 'RENT' as const,
    category: 'COMMERCIAL' as const,
    price: 2500,
    currency: 'USD',
    address: 'вул. Хрещатик, 25',
    city: 'Київ',
    country: 'Україна',
    latitude: 50.4501,
    longitude: 30.5234,
    area: 180,
    images: ['https://images.unsplash.com/photo-1431540015161-0bf868a2d407'],
    amenities: ['security', 'parking', 'meetingRoom', 'fiberInternet'],
    status: 'PUBLISHED' as const,
    createdAt: '2021-12-15T11:00:00.000Z',
    updatedAt: '2024-06-10T12:00:00.000Z',
    owner: {
      id: 'owner-kyiv-office',
      name: 'Олексій Мельник',
      email: 'oleksii@example.com',
    },
  },
  {
    id: 'mock-istanbul-apartment',
    title: 'Modern daire İstanbul merkezinde',
    description: 'Сучасна квартира в центрі Стамбула з видом на Босфор.',
    type: 'RENT' as const,
    category: 'APARTMENT' as const,
    price: 1100,
    currency: 'USD',
    address: 'İstiklal Caddesi 45',
    city: 'İstanbul',
    country: 'Türkiye',
    latitude: 41.0082,
    longitude: 28.9784,
    area: 88,
    rooms: 3,
    images: ['https://images.unsplash.com/photo-1505691723518-36a5ac3be353'],
    amenities: ['elevator', 'balcony', 'security'],
    status: 'PUBLISHED' as const,
    createdAt: '2021-11-20T10:00:00.000Z',
    updatedAt: '2024-06-05T11:00:00.000Z',
    owner: {
      id: 'owner-istanbul',
      name: 'Mehmet Yılmaz',
      email: 'mehmet@example.com',
    },
  },
  {
    id: 'mock-tokyo-apartment',
    title: 'モダンなアパートメント 東京中心部',
    description: 'Сучасна квартира в центрі Токіо з видом на місто.',
    type: 'RENT' as const,
    category: 'APARTMENT' as const,
    price: 3200,
    currency: 'JPY',
    address: 'Shibuya 1-2-3',
    city: 'Tokyo',
    country: 'Japan',
    latitude: 35.6762,
    longitude: 139.6503,
    area: 55,
    rooms: 1,
    images: ['https://images.unsplash.com/photo-1505691723518-36a5ac3be353'],
    amenities: ['elevator', 'security'],
    status: 'PUBLISHED' as const,
    createdAt: '2021-10-15T08:00:00.000Z',
    updatedAt: '2024-06-01T09:00:00.000Z',
    owner: {
      id: 'owner-tokyo',
      name: 'Yuki Tanaka',
      email: 'yuki@example.com',
    },
  },
  {
    id: 'mock-seoul-apartment',
    title: '서울 중심부의 모던한 아파트',
    description: 'Сучасна квартира в центрі Сеула з дизайнерським ремонтом.',
    type: 'RENT' as const,
    category: 'APARTMENT' as const,
    price: 1800,
    currency: 'USD',
    address: 'Gangnam-gu 123',
    city: 'Seoul',
    country: 'South Korea',
    latitude: 37.5665,
    longitude: 126.978,
    area: 75,
    rooms: 2,
    images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267'],
    amenities: ['elevator', 'security', 'floorHeating'],
    status: 'PUBLISHED' as const,
    createdAt: '2021-09-08T12:00:00.000Z',
    updatedAt: '2024-05-28T13:00:00.000Z',
    owner: {
      id: 'owner-seoul',
      name: 'Min-jun Park',
      email: 'minjun@example.com',
    },
  },
  {
    id: 'mock-singapore-apartment',
    title: 'Modern Condo in Singapore',
    description: 'Сучасна квартира в центрі Сінгапуру з басейном та gym.',
    type: 'RENT' as const,
    category: 'APARTMENT' as const,
    price: 4200,
    currency: 'SGD',
    address: 'Orchard Road 25',
    city: 'Singapore',
    country: 'Singapore',
    latitude: 1.3521,
    longitude: 103.8198,
    area: 95,
    rooms: 3,
    images: ['https://images.unsplash.com/photo-1505691723518-36a5ac3be353'],
    amenities: ['elevator', 'pool', 'gym', 'concierge'],
    status: 'PUBLISHED' as const,
    createdAt: '2021-08-12T14:00:00.000Z',
    updatedAt: '2024-05-25T15:00:00.000Z',
    owner: {
      id: 'owner-singapore',
      name: 'Wei Chen',
      email: 'wei@example.com',
    },
  },
];

export async function GET() {
  // Повертаємо HTML форму для виклику POST запиту
  return new NextResponse(
    `<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Seed Listings</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      max-width: 500px;
      width: 100%;
    }
    h1 {
      color: #333;
      margin-top: 0;
      margin-bottom: 10px;
    }
    p {
      color: #666;
      margin-bottom: 30px;
      line-height: 1.6;
    }
    button {
      background: #667eea;
      color: white;
      border: none;
      padding: 14px 28px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      width: 100%;
      transition: background 0.3s;
    }
    button:hover {
      background: #5568d3;
    }
    button:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
    .result {
      margin-top: 20px;
      padding: 15px;
      border-radius: 8px;
      display: none;
    }
    .success {
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }
    .error {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }
    .loading {
      text-align: center;
      color: #667eea;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🌱 Seed Listings</h1>
    <p>Натисніть кнопку нижче, щоб записати близько 40 оголошень в базу даних.</p>
    <button id="seedBtn" onclick="seedListings()">Записати Listings</button>
    <div id="result" class="result"></div>
  </div>
  <script>
    async function seedListings() {
      const btn = document.getElementById('seedBtn');
      const result = document.getElementById('result');
      
      btn.disabled = true;
      btn.textContent = 'Записуємо...';
      result.style.display = 'block';
      result.className = 'result loading';
      result.innerHTML = '⏳ Записуємо listings в базу даних...';
      
      try {
        const response = await fetch('/api/admin/seed-listings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        const data = await response.json();
        
        if (data.success) {
          result.className = 'result success';
          result.innerHTML = \`
            <strong>✅ Успіх!</strong><br>
            Створено: <strong>\${data.created}</strong> listings з <strong>\${data.total}</strong><br>
            \${data.errors && data.errors.length > 0 ? '<br><strong>Помилки:</strong><br>' + data.errors.join('<br>') : ''}
          \`;
        } else {
          result.className = 'result error';
          result.innerHTML = \`<strong>❌ Помилка:</strong> \${data.error || 'Невідома помилка'}\`;
        }
      } catch (error) {
        result.className = 'result error';
        result.innerHTML = \`<strong>❌ Помилка:</strong> \${error.message}\`;
      } finally {
        btn.disabled = false;
        btn.textContent = 'Записати Listings';
      }
    }
  </script>
</body>
</html>`,
    {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    },
  );
}

export async function POST() {
  try {
    const supabase = getSupabaseClient(true);

    // Перевіряємо назву таблиці Listing
    const tableNames = ['Listing', 'listings', 'Listings', 'listing'];
    let actualTableName: string | null = null;

    for (const tableName of tableNames) {
      const result = await supabase.from(tableName).select('id').limit(1);
      if (!result.error) {
        actualTableName = tableName;
        break;
      }
    }

    if (!actualTableName) {
      return NextResponse.json(
        {
          success: false,
          error: 'Could not find Listing table in the database.',
          hint: 'Please make sure the table exists in your Supabase database. Table should be named "Listing" in the public schema.',
        },
        { status: 500 },
      );
    }

    // Перевіряємо назву таблиці User
    const userTableNames = ['User', 'user', 'Users', 'users'];
    let actualUserTableName: string | null = null;

    for (const tableName of userTableNames) {
      const result = await supabase.from(tableName).select('id').limit(1);
      if (!result.error) {
        actualUserTableName = tableName;
        break;
      }
    }

    if (!actualUserTableName) {
      return NextResponse.json(
        {
          success: false,
          error: 'Could not find User table in the database.',
          hint: 'Please make sure the User table exists in your Supabase database.',
        },
        { status: 500 },
      );
    }

    // Збираємо унікальних власників
    const uniqueOwners = new Map<string, (typeof extendedListings)[0]['owner']>();
    extendedListings.forEach((listing) => {
      if (!uniqueOwners.has(listing.owner.id)) {
        uniqueOwners.set(listing.owner.id, listing.owner);
      }
    });

    // Створюємо або отримуємо користувачів (власників)
    const ownerIdMap = new Map<string, string>(); // owner.id -> user.id в БД

    for (const ownerId of Array.from(uniqueOwners.keys())) {
      const owner = uniqueOwners.get(ownerId)!;
      try {
        // Перевіряємо, чи існує користувач з таким email
        const userResult = await supabase
          .from(actualUserTableName)
          .select('id')
          .eq('email', owner.email)
          .maybeSingle();

        let userId: string;

        if (userResult.data && !userResult.error) {
          // Користувач існує
          userId = userResult.data.id;
        } else {
          // Створюємо нового користувача
          const hashedPassword = await bcrypt.hash('defaultPassword123', 10);
          const newUser: {
            id: string;
            email: string;
            password: string;
            name: string | null;
            role: string;
            phone?: string | null;
            avatar?: string | null;
          } = {
            id: owner.id.startsWith('owner-') ? owner.id : `owner-${owner.id}`,
            email: owner.email,
            name: owner.name,
            password: hashedPassword,
            role: 'OWNER',
          };
          if ('phone' in owner && owner.phone && typeof owner.phone === 'string') {
            newUser.phone = owner.phone;
          }
          if ('avatar' in owner && owner.avatar && typeof owner.avatar === 'string') {
            newUser.avatar = owner.avatar;
          }

          const insertUserResult = await supabase
            .from(actualUserTableName)
            .insert(newUser)
            .select('id')
            .single();

          if (insertUserResult.error) {
            console.error(`Error creating user ${owner.email}:`, insertUserResult.error);
            // Якщо помилка через дублікат ID, спробуємо згенерувати новий
            if (
              insertUserResult.error.message?.includes('duplicate') ||
              insertUserResult.error.code === '23505'
            ) {
              newUser.id = randomUUID();
              const retryResult = await supabase
                .from(actualUserTableName)
                .insert(newUser)
                .select('id')
                .single();
              if (retryResult.error) {
                throw retryResult.error;
              }
              userId = retryResult.data.id;
            } else {
              throw insertUserResult.error;
            }
          } else {
            userId = insertUserResult.data.id;
          }
        }

        ownerIdMap.set(ownerId, userId);
      } catch (error) {
        console.error(`Error processing owner ${owner.email}:`, error);
        // Продовжуємо з іншими власниками
      }
    }

    const createdListings = [];
    const errors = [];

    for (const listing of extendedListings) {
      try {
        const ownerId = ownerIdMap.get(listing.owner.id);
        if (!ownerId) {
          errors.push(`Owner not found/created for listing ${listing.id}`);
          continue;
        }

        // Перевіряємо, чи listing вже існує
        const existingCheck = await supabase
          .from(actualTableName)
          .select('id')
          .eq('title', listing.title)
          .eq('address', listing.address || '')
          .maybeSingle();

        if (existingCheck.data && !existingCheck.error) {
          console.log(`Listing "${listing.title}" already exists, skipping`);
          continue;
        }

        // Маппінг полів відповідно до схеми БД
        const listingData: {
          id: string;
          title: string;
          description: string;
          type: string;
          category: string;
          price: number;
          currency: string;
          address: string;
          status: string;
          ownerId: string;
          latitude?: number;
          longitude?: number;
          area?: number;
          rooms?: number;
          images?: string[];
          amenities?: string[];
          availableFrom?: string;
          availableTo?: string;
          createdAt?: string;
          updatedAt?: string;
        } = {
          id: listing.id || `listing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: listing.title,
          description: listing.description || '',
          type: listing.type, // 'RENT' | 'SALE'
          category: listing.category, // 'APARTMENT' | 'HOUSE' | 'COMMERCIAL'
          price: listing.price, // double precision
          currency: listing.currency || 'UAH',
          address: listing.address,
          status: listing.status || 'PUBLISHED', // 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'ARCHIVED'
          ownerId: ownerId, // foreign key to User
        };

        // Опціональні поля
        if (listing.latitude !== null && listing.latitude !== undefined) {
          listingData.latitude = listing.latitude;
        }
        if (listing.longitude !== null && listing.longitude !== undefined) {
          listingData.longitude = listing.longitude;
        }
        if (listing.area !== null && listing.area !== undefined) {
          listingData.area = listing.area;
        }
        if (listing.rooms !== null && listing.rooms !== undefined) {
          listingData.rooms = listing.rooms;
        }
        if (listing.images && listing.images.length > 0) {
          listingData.images = listing.images; // text[] array
        }
        if (listing.amenities && listing.amenities.length > 0) {
          listingData.amenities = listing.amenities; // text[] array
        }
        if ('availableFrom' in listing && listing.availableFrom) {
          listingData.availableFrom = String(listing.availableFrom);
        }
        if ('availableTo' in listing && listing.availableTo) {
          listingData.availableTo = String(listing.availableTo);
        }
        if (listing.createdAt) {
          listingData['createdAt'] = listing.createdAt;
        }
        if (listing.updatedAt) {
          listingData['updatedAt'] = listing.updatedAt;
        }

        // Вставляємо listing
        const insertResult = await supabase
          .from(actualTableName)
          .insert(listingData)
          .select('id')
          .single();

        if (insertResult.error) {
          const errorMsg = insertResult.error.message || 'Unknown error';
          errors.push(`Error creating listing ${listing.id}: ${errorMsg}`);
          console.error('Insert error:', insertResult.error);
          console.error('Table name used:', actualTableName);
          console.error('Data keys:', Object.keys(listingData));
          continue;
        }

        createdListings.push(insertResult.data.id);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Error processing listing ${listing.id}: ${errorMessage}`);
        console.error('Error:', error);
      }
    }

    return NextResponse.json({
      success: true,
      created: createdListings.length,
      total: extendedListings.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully created ${createdListings.length} listings out of ${extendedListings.length}`,
    });
  } catch (error) {
    console.error('Error seeding listings:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to seed listings';
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 },
    );
  }
}
