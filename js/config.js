// Конфигурация Supabase
const SUPABASE_URL = 'https://wlurkexmwfagkxiypbqt.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdXJrZXhtd2ZhZ2t4aXlwYnF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2ODIxMTAsImV4cCI6MjA2MTI1ODExMH0.0xF6cIgm5h-wA_O_f1ZAZhw7fxPNTzIwkNYUICdaAaM'

// Инициализация Supabase клиента
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)

// Конфигурация Mapbox
const MAPBOX_TOKEN = 'pk.eyJ1IjoiY3Jlb2dlbmthcnVzIiwiYSI6ImNtOTg4b242YjAwZHIyanF1MXkxZnVqcHoifQ.0_NhUoQVTA8zGEUUVOqcLw'

// Конфигурация приложения
const config = {
    // Настройки для работы с местами
    places: {
        table: 'meal_places',
        limit: 20,
        fields: {
            name: 'name',
            review: 'revew',
            placephotos: 'placephotos',
            vibe: 'vibe',
            type: 'type',
            location: 'countrycity',
            kitchen: 'kitchen'
        }
    },
    // Настройки для работы с маршрутами
    routes: {
        table: 'routes',
        limit: 10
    },
    // Настройки для работы с профилем
    profile: {
        table: 'profiles'
    }
} 