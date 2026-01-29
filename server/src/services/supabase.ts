import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { config } from '../config/env.js'

let supabaseClient: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    if (!config.supabaseUrl || !config.supabaseServiceKey) {
      throw new Error('Supabase configuration is missing')
    }
    supabaseClient = createClient(config.supabaseUrl, config.supabaseServiceKey)
  }
  return supabaseClient
}

// Types for database tables
export interface DocumentChunk {
  id: string
  content: string
  embedding: number[] | null
  metadata: Record<string, unknown>
  source_file: string
  source_type: string
  chunk_index: number
  created_at: string
  updated_at: string
}

export interface Tutor {
  id: string
  name: string
  email: string | null
  subjects: string[]
  bio: string | null
  location: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TutorSchedule {
  id: string
  tutor_id: string
  day_of_week: number
  start_time: string
  end_time: string
  location: string | null
  is_recurring: boolean
  effective_from: string | null
  effective_until: string | null
  created_at: string
}

// Helper functions for common queries
export async function getTutorAvailability(date: Date): Promise<Array<{
  tutor_id: string
  tutor_name: string
  subjects: string[]
  start_time: string
  end_time: string
  location: string
}>> {
  const supabase = getSupabase()
  const dateStr = date.toISOString().split('T')[0]

  const { data, error } = await supabase.rpc('get_tutor_availability', {
    query_date: dateStr
  })

  if (error) {
    console.error('Error fetching tutor availability:', error)
    throw error
  }

  return data || []
}

export async function searchTutorsBySubject(subject: string): Promise<Tutor[]> {
  const supabase = getSupabase()

  const { data, error } = await supabase.rpc('search_tutors_by_subject', {
    search_subject: subject
  })

  if (error) {
    console.error('Error searching tutors:', error)
    throw error
  }

  return data || []
}

export async function getAllTutors(): Promise<Tutor[]> {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('tutors')
    .select('*')
    .eq('is_active', true)
    .order('name')

  if (error) {
    console.error('Error fetching tutors:', error)
    throw error
  }

  return data || []
}

export async function insertDocumentChunks(chunks: Omit<DocumentChunk, 'id' | 'created_at' | 'updated_at'>[]): Promise<void> {
  const supabase = getSupabase()

  const { error } = await supabase
    .from('document_chunks')
    .insert(chunks)

  if (error) {
    console.error('Error inserting document chunks:', error)
    throw error
  }
}

export async function deleteDocumentChunksBySource(sourceFile: string): Promise<void> {
  const supabase = getSupabase()

  const { error } = await supabase
    .from('document_chunks')
    .delete()
    .eq('source_file', sourceFile)

  if (error) {
    console.error('Error deleting document chunks:', error)
    throw error
  }
}
