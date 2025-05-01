export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      access_level_permission: {
        Row: {
          access_level: string
          created_by: string | null
          created_date: string
          entity_type: string
          permission_code: string
          updated_by: string | null
          updated_date: string
        }
        Insert: {
          access_level: string
          created_by?: string | null
          created_date?: string
          entity_type: string
          permission_code: string
          updated_by?: string | null
          updated_date?: string
        }
        Update: {
          access_level?: string
          created_by?: string | null
          created_date?: string
          entity_type?: string
          permission_code?: string
          updated_by?: string | null
          updated_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_type_access_level_fkey"
            columns: ["access_level", "entity_type"]
            isOneToOne: false
            referencedRelation: "entity_type_access_level"
            referencedColumns: ["access_level", "entity_type"]
          },
          {
            foreignKeyName: "permission_code_fkey"
            columns: ["permission_code"]
            isOneToOne: false
            referencedRelation: "permission"
            referencedColumns: ["permission_code"]
          },
        ]
      }
      activity: {
        Row: {
          _name: string
          _type: string | null
          created_by: string | null
          created_date: string
          gen_instructions: string | null
          generated_for_skill_paths: Json | null
          generated_for_user: string | null
          id: string
          metadata: Json | null
          source: string | null
          type_config: Json | null
          updated_by: string | null
          updated_date: string
        }
        Insert: {
          _name: string
          _type?: string | null
          created_by?: string | null
          created_date?: string
          gen_instructions?: string | null
          generated_for_skill_paths?: Json | null
          generated_for_user?: string | null
          id?: string
          metadata?: Json | null
          source?: string | null
          type_config?: Json | null
          updated_by?: string | null
          updated_date?: string
        }
        Update: {
          _name?: string
          _type?: string | null
          created_by?: string | null
          created_date?: string
          gen_instructions?: string | null
          generated_for_skill_paths?: Json | null
          generated_for_user?: string | null
          id?: string
          metadata?: Json | null
          source?: string | null
          type_config?: Json | null
          updated_by?: string | null
          updated_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_generated_for_user_fkey"
            columns: ["generated_for_user"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_set: {
        Row: {
          _description: string | null
          _name: string | null
          created_by: string | null
          created_date: string
          for_user: string | null
          id: string
          metadata: Json | null
          updated_by: string | null
          updated_date: string
        }
        Insert: {
          _description?: string | null
          _name?: string | null
          created_by?: string | null
          created_date?: string
          for_user?: string | null
          id?: string
          metadata?: Json | null
          updated_by?: string | null
          updated_date?: string
        }
        Update: {
          _description?: string | null
          _name?: string | null
          created_by?: string | null
          created_date?: string
          for_user?: string | null
          id?: string
          metadata?: Json | null
          updated_by?: string | null
          updated_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_set_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_set_for_user_fkey"
            columns: ["for_user"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_set_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_set_activity: {
        Row: {
          activity: string | null
          activity_set: string | null
          created_by: string | null
          created_date: string
          id: string
          metadata: Json | null
          updated_by: string | null
          updated_date: string
        }
        Insert: {
          activity?: string | null
          activity_set?: string | null
          created_by?: string | null
          created_date?: string
          id?: string
          metadata?: Json | null
          updated_by?: string | null
          updated_date?: string
        }
        Update: {
          activity?: string | null
          activity_set?: string | null
          created_by?: string | null
          created_date?: string
          id?: string
          metadata?: Json | null
          updated_by?: string | null
          updated_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_set_activity_activity_fkey"
            columns: ["activity"]
            isOneToOne: false
            referencedRelation: "activity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_set_activity_activity_set_fkey"
            columns: ["activity_set"]
            isOneToOne: false
            referencedRelation: "activity_set"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_set_activity_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_set_activity_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_skill: {
        Row: {
          _type: string | null
          _weight: number | null
          activity: string | null
          created_by: string | null
          created_date: string
          id: string
          metadata: Json | null
          skill: string | null
          updated_by: string | null
          updated_date: string
        }
        Insert: {
          _type?: string | null
          _weight?: number | null
          activity?: string | null
          created_by?: string | null
          created_date?: string
          id?: string
          metadata?: Json | null
          skill?: string | null
          updated_by?: string | null
          updated_date?: string
        }
        Update: {
          _type?: string | null
          _weight?: number | null
          activity?: string | null
          created_by?: string | null
          created_date?: string
          id?: string
          metadata?: Json | null
          skill?: string | null
          updated_by?: string | null
          updated_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_skill_activity_fkey"
            columns: ["activity"]
            isOneToOne: false
            referencedRelation: "activity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_skill_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_skill_skill_fkey"
            columns: ["skill"]
            isOneToOne: false
            referencedRelation: "skill"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_skill_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
        ]
      }
      analyzer: {
        Row: {
          _description: string | null
          _name: string | null
          ai_jsonschema: Json | null
          ai_prompt: string | null
          created_by: string | null
          created_date: string
          id: string
          metadata: Json | null
          updated_by: string | null
          updated_date: string
        }
        Insert: {
          _description?: string | null
          _name?: string | null
          ai_jsonschema?: Json | null
          ai_prompt?: string | null
          created_by?: string | null
          created_date?: string
          id?: string
          metadata?: Json | null
          updated_by?: string | null
          updated_date?: string
        }
        Update: {
          _description?: string | null
          _name?: string | null
          ai_jsonschema?: Json | null
          ai_prompt?: string | null
          created_by?: string | null
          created_date?: string
          id?: string
          metadata?: Json | null
          updated_by?: string | null
          updated_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "analyzer_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analyzer_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_post: {
        Row: {
          content: string
          created_by: string | null
          created_date: string
          id: string
          is_published: boolean
          short_description: string | null
          slug: string
          tags: string[]
          title: string
          updated_by: string | null
          updated_date: string
        }
        Insert: {
          content: string
          created_by?: string | null
          created_date?: string
          id?: string
          is_published?: boolean
          short_description?: string | null
          slug: string
          tags?: string[]
          title: string
          updated_by?: string | null
          updated_date?: string
        }
        Update: {
          content?: string
          created_by?: string | null
          created_date?: string
          id?: string
          is_published?: boolean
          short_description?: string | null
          slug?: string
          tags?: string[]
          title?: string
          updated_by?: string | null
          updated_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_post_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
        ]
      }
      bot: {
        Row: {
          avatar_emoji: string | null
          avatar_url: string | null
          created_by: string | null
          created_date: string
          description: string | null
          extras: Json | null
          forked_from: string | null
          id: string
          is_public: boolean
          name: string | null
          prompt: string | null
          updated_by: string | null
          updated_date: string
        }
        Insert: {
          avatar_emoji?: string | null
          avatar_url?: string | null
          created_by?: string | null
          created_date?: string
          description?: string | null
          extras?: Json | null
          forked_from?: string | null
          id?: string
          is_public?: boolean
          name?: string | null
          prompt?: string | null
          updated_by?: string | null
          updated_date?: string
        }
        Update: {
          avatar_emoji?: string | null
          avatar_url?: string | null
          created_by?: string | null
          created_date?: string
          description?: string | null
          extras?: Json | null
          forked_from?: string | null
          id?: string
          is_public?: boolean
          name?: string | null
          prompt?: string | null
          updated_by?: string | null
          updated_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "bot_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bot_forked_from_fkey"
            columns: ["forked_from"]
            isOneToOne: false
            referencedRelation: "bot"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bot_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
        ]
      }
      bot_set: {
        Row: {
          _description: string | null
          _name: string | null
          created_by: string | null
          created_date: string
          for_user: string | null
          id: string
          metadata: Json | null
          updated_by: string | null
          updated_date: string
        }
        Insert: {
          _description?: string | null
          _name?: string | null
          created_by?: string | null
          created_date?: string
          for_user?: string | null
          id?: string
          metadata?: Json | null
          updated_by?: string | null
          updated_date?: string
        }
        Update: {
          _description?: string | null
          _name?: string | null
          created_by?: string | null
          created_date?: string
          for_user?: string | null
          id?: string
          metadata?: Json | null
          updated_by?: string | null
          updated_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "bot_set_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bot_set_for_user_fkey"
            columns: ["for_user"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bot_set_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
        ]
      }
      bot_set_bot: {
        Row: {
          bot: string | null
          bot_set: string | null
          created_by: string | null
          created_date: string
          id: string
          metadata: Json | null
          updated_by: string | null
          updated_date: string
        }
        Insert: {
          bot?: string | null
          bot_set?: string | null
          created_by?: string | null
          created_date?: string
          id?: string
          metadata?: Json | null
          updated_by?: string | null
          updated_date?: string
        }
        Update: {
          bot?: string | null
          bot_set?: string | null
          created_by?: string | null
          created_date?: string
          id?: string
          metadata?: Json | null
          updated_by?: string | null
          updated_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "bot_set_bot_bot_fkey"
            columns: ["bot"]
            isOneToOne: false
            referencedRelation: "bot"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bot_set_bot_bot_set_fkey"
            columns: ["bot_set"]
            isOneToOne: false
            referencedRelation: "bot_set"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bot_set_bot_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bot_set_bot_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
        ]
      }
      chapter: {
        Row: {
          _name: string
          _summary: string | null
          created_by: string | null
          created_date: string
          for_user: string | null
          icon: string | null
          id: string
          metadata: Json | null
          root_skill: string
          root_skill_order: number | null
          root_skill_path: string[] | null
          updated_by: string | null
          updated_date: string
        }
        Insert: {
          _name: string
          _summary?: string | null
          created_by?: string | null
          created_date?: string
          for_user?: string | null
          icon?: string | null
          id?: string
          metadata?: Json | null
          root_skill: string
          root_skill_order?: number | null
          root_skill_path?: string[] | null
          updated_by?: string | null
          updated_date?: string
        }
        Update: {
          _name?: string
          _summary?: string | null
          created_by?: string | null
          created_date?: string
          for_user?: string | null
          icon?: string | null
          id?: string
          metadata?: Json | null
          root_skill?: string
          root_skill_order?: number | null
          root_skill_path?: string[] | null
          updated_by?: string | null
          updated_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapter_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chapter_for_user_fkey"
            columns: ["for_user"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chapter_root_skill_fkey"
            columns: ["root_skill"]
            isOneToOne: false
            referencedRelation: "skill"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chapter_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
        ]
      }
      chat: {
        Row: {
          auto_title: string | null
          created_by: string | null
          created_date: string
          id: string
          is_public: boolean
          manual_title: string | null
          topic: string | null
          updated_by: string | null
          updated_date: string
        }
        Insert: {
          auto_title?: string | null
          created_by?: string | null
          created_date?: string
          id?: string
          is_public?: boolean
          manual_title?: string | null
          topic?: string | null
          updated_by?: string | null
          updated_date?: string
        }
        Update: {
          auto_title?: string | null
          created_by?: string | null
          created_date?: string
          id?: string
          is_public?: boolean
          manual_title?: string | null
          topic?: string | null
          updated_by?: string | null
          updated_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_message: {
        Row: {
          _role: string | null
          body: string | null
          bot_id: string | null
          chat_id: string
          context_data: Json | null
          context_id: string | null
          context_type: string | null
          created_by: string | null
          created_by_bot: string | null
          created_date: string
          function_call: Json | null
          id: string
          updated_by: string | null
          updated_date: string
        }
        Insert: {
          _role?: string | null
          body?: string | null
          bot_id?: string | null
          chat_id: string
          context_data?: Json | null
          context_id?: string | null
          context_type?: string | null
          created_by?: string | null
          created_by_bot?: string | null
          created_date?: string
          function_call?: Json | null
          id?: string
          updated_by?: string | null
          updated_date?: string
        }
        Update: {
          _role?: string | null
          body?: string | null
          bot_id?: string | null
          chat_id?: string
          context_data?: Json | null
          context_id?: string | null
          context_type?: string | null
          created_by?: string | null
          created_by_bot?: string | null
          created_date?: string
          function_call?: Json | null
          id?: string
          updated_by?: string | null
          updated_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_message_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "bot"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_message_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_message_created_by_bot_fkey"
            columns: ["created_by_bot"]
            isOneToOne: false
            referencedRelation: "bot"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_message_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_message_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
        ]
      }
      chrome_extension_event: {
        Row: {
          created_by: string | null
          created_date: string
          event_type: string
          id: string
          metadata: Json | null
          page_title: string | null
          rsn_user_id: string
          site_url: string | null
          updated_by: string | null
          updated_date: string
          viewed_at: string
        }
        Insert: {
          created_by?: string | null
          created_date?: string
          event_type: string
          id?: string
          metadata?: Json | null
          page_title?: string | null
          rsn_user_id: string
          site_url?: string | null
          updated_by?: string | null
          updated_date?: string
          viewed_at: string
        }
        Update: {
          created_by?: string | null
          created_date?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          page_title?: string | null
          rsn_user_id?: string
          site_url?: string | null
          updated_by?: string | null
          updated_date?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chrome_extension_event_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chrome_extension_event_rsn_user_id_fkey"
            columns: ["rsn_user_id"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chrome_extension_event_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
        ]
      }
      course: {
        Row: {
          _description: string | null
          _name: string
          cover_image_url: string | null
          created_by: string | null
          created_date: string
          for_user: string | null
          id: string
          root_skill: string | null
          updated_by: string | null
          updated_date: string
        }
        Insert: {
          _description?: string | null
          _name: string
          cover_image_url?: string | null
          created_by?: string | null
          created_date?: string
          for_user?: string | null
          id?: string
          root_skill?: string | null
          updated_by?: string | null
          updated_date?: string
        }
        Update: {
          _description?: string | null
          _name?: string
          cover_image_url?: string | null
          created_by?: string | null
          created_date?: string
          for_user?: string | null
          id?: string
          root_skill?: string | null
          updated_by?: string | null
          updated_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_for_user_fkey"
            columns: ["for_user"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_root_skill_fkey"
            columns: ["root_skill"]
            isOneToOne: false
            referencedRelation: "skill"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
        ]
      }
      course_lesson: {
        Row: {
          course: string
          created_by: string | null
          created_date: string
          id: string
          lesson: string
          order_index: number
          updated_by: string | null
          updated_date: string
        }
        Insert: {
          course: string
          created_by?: string | null
          created_date?: string
          id?: string
          lesson: string
          order_index?: number
          updated_by?: string | null
          updated_date?: string
        }
        Update: {
          course?: string
          created_by?: string | null
          created_date?: string
          id?: string
          lesson?: string
          order_index?: number
          updated_by?: string | null
          updated_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_lesson_course_fkey"
            columns: ["course"]
            isOneToOne: false
            referencedRelation: "course"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_lesson_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_lesson_lesson_fkey"
            columns: ["lesson"]
            isOneToOne: false
            referencedRelation: "lesson"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_lesson_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
        ]
      }
      email_subscription: {
        Row: {
          account_updates: boolean | null
          created_by: string | null
          created_date: string
          edtech_updates: boolean
          id: string
          newsletter: boolean
          product_updates: boolean
          resend_synced: boolean
          rsn_user_id: string | null
          updated_by: string | null
          updated_date: string
        }
        Insert: {
          account_updates?: boolean | null
          created_by?: string | null
          created_date?: string
          edtech_updates?: boolean
          id?: string
          newsletter?: boolean
          product_updates?: boolean
          resend_synced?: boolean
          rsn_user_id?: string | null
          updated_by?: string | null
          updated_date?: string
        }
        Update: {
          account_updates?: boolean | null
          created_by?: string | null
          created_date?: string
          edtech_updates?: boolean
          id?: string
          newsletter?: boolean
          product_updates?: boolean
          resend_synced?: boolean
          rsn_user_id?: string | null
          updated_by?: string | null
          updated_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_subscription_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_subscription_rsn_user_id_fkey"
            columns: ["rsn_user_id"]
            isOneToOne: true
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_subscription_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
        ]
      }
      entity: {
        Row: {
          created_by: string | null
          created_date: string
          e_data: Json | null
          e_name: string | null
          e_type: string | null
          id: string
          updated_by: string | null
          updated_date: string
        }
        Insert: {
          created_by?: string | null
          created_date?: string
          e_data?: Json | null
          e_name?: string | null
          e_type?: string | null
          id?: string
          updated_by?: string | null
          updated_date?: string
        }
        Update: {
          created_by?: string | null
          created_date?: string
          e_data?: Json | null
          e_name?: string | null
          e_type?: string | null
          id?: string
          updated_by?: string | null
          updated_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_type: {
        Row: {
          abbreviation: string
          created_by: string | null
          created_date: string
          entity_type: string
          updated_by: string | null
          updated_date: string
        }
        Insert: {
          abbreviation: string
          created_by?: string | null
          created_date?: string
          entity_type: string
          updated_by?: string | null
          updated_date?: string
        }
        Update: {
          abbreviation?: string
          created_by?: string | null
          created_date?: string
          entity_type?: string
          updated_by?: string | null
          updated_date?: string
        }
        Relationships: []
      }
      entity_type_access_level: {
        Row: {
          access_level: string
          created_by: string | null
          created_date: string
          entity_type: string
          updated_by: string | null
          updated_date: string
        }
        Insert: {
          access_level: string
          created_by?: string | null
          created_date?: string
          entity_type: string
          updated_by?: string | null
          updated_date?: string
        }
        Update: {
          access_level?: string
          created_by?: string | null
          created_date?: string
          entity_type?: string
          updated_by?: string | null
          updated_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_type_entity_type_fkey"
            columns: ["entity_type"]
            isOneToOne: false
            referencedRelation: "entity_type"
            referencedColumns: ["entity_type"]
          },
        ]
      }
      goal: {
        Row: {
          _name: string
          _type: string | null
          completed_date: string | null
          created_by: string | null
          created_date: string
          due_date: string | null
          id: string
          is_completed: boolean
          metadata: Json | null
          updated_by: string | null
          updated_date: string
        }
        Insert: {
          _name: string
          _type?: string | null
          completed_date?: string | null
          created_by?: string | null
          created_date?: string
          due_date?: string | null
          id?: string
          is_completed?: boolean
          metadata?: Json | null
          updated_by?: string | null
          updated_date?: string
        }
        Update: {
          _name?: string
          _type?: string | null
          completed_date?: string | null
          created_by?: string | null
          created_date?: string
          due_date?: string | null
          id?: string
          is_completed?: boolean
          metadata?: Json | null
          updated_by?: string | null
          updated_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
        ]
      }
      group: {
        Row: {
          group_name: string | null
          id: string
        }
        Insert: {
          group_name?: string | null
          id?: string
        }
        Update: {
          group_name?: string | null
          id?: string
        }
        Relationships: []
      }
      integration: {
        Row: {
          _type: string
          created_by: string | null
          created_date: string
          for_user: string | null
          id: string
          last_synced: string | null
          metadata: Json | null
          updated_by: string | null
          updated_date: string
        }
        Insert: {
          _type: string
          created_by?: string | null
          created_date?: string
          for_user?: string | null
          id?: string
          last_synced?: string | null
          metadata?: Json | null
          updated_by?: string | null
          updated_date?: string
        }
        Update: {
          _type?: string
          created_by?: string | null
          created_date?: string
          for_user?: string | null
          id?: string
          last_synced?: string | null
          metadata?: Json | null
          updated_by?: string | null
          updated_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_for_user_fkey"
            columns: ["for_user"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_token: {
        Row: {
          created_by: string | null
          created_date: string
          id: string
          integration_id: string
          metadata: Json | null
          token: string
          updated_by: string | null
          updated_date: string
        }
        Insert: {
          created_by?: string | null
          created_date?: string
          id?: string
          integration_id: string
          metadata?: Json | null
          token: string
          updated_by?: string | null
          updated_date?: string
        }
        Update: {
          created_by?: string | null
          created_date?: string
          id?: string
          integration_id?: string
          metadata?: Json | null
          token?: string
          updated_by?: string | null
          updated_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_token_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_token_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integration"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_token_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
        ]
      }
      journal: {
        Row: {
          _name: string
          created_by: string | null
          created_date: string
          id: string
          metadata: Json | null
          updated_by: string | null
          updated_date: string
        }
        Insert: {
          _name: string
          created_by?: string | null
          created_date?: string
          id?: string
          metadata?: Json | null
          updated_by?: string | null
          updated_date?: string
        }
        Update: {
          _name?: string
          created_by?: string | null
          created_date?: string
          id?: string
          metadata?: Json | null
          updated_by?: string | null
          updated_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson: {
        Row: {
          _name: string | null
          _summary: string | null
          chapter: string | null
          chapter_order: number | null
          created_by: string | null
          created_date: string
          for_user: string | null
          icon: string | null
          id: string
          lesson_type: string | null
          metadata: Json | null
          root_skill: string | null
          root_skill_path: string[] | null
          snip_ids: string[] | null
          updated_by: string | null
          updated_date: string
        }
        Insert: {
          _name?: string | null
          _summary?: string | null
          chapter?: string | null
          chapter_order?: number | null
          created_by?: string | null
          created_date?: string
          for_user?: string | null
          icon?: string | null
          id?: string
          lesson_type?: string | null
          metadata?: Json | null
          root_skill?: string | null
          root_skill_path?: string[] | null
          snip_ids?: string[] | null
          updated_by?: string | null
          updated_date?: string
        }
        Update: {
          _name?: string | null
          _summary?: string | null
          chapter?: string | null
          chapter_order?: number | null
          created_by?: string | null
          created_date?: string
          for_user?: string | null
          icon?: string | null
          id?: string
          lesson_type?: string | null
          metadata?: Json | null
          root_skill?: string | null
          root_skill_path?: string[] | null
          snip_ids?: string[] | null
          updated_by?: string | null
          updated_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_chapter_fkey"
            columns: ["chapter"]
            isOneToOne: false
            referencedRelation: "chapter"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_for_user_fkey"
            columns: ["for_user"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_root_skill_fkey"
            columns: ["root_skill"]
            isOneToOne: false
            referencedRelation: "skill"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_activity: {
        Row: {
          activity: string | null
          created_by: string | null
          created_date: string
          id: string
          lesson: string | null
          metadata: Json | null
          position: number
          updated_by: string | null
          updated_date: string
        }
        Insert: {
          activity?: string | null
          created_by?: string | null
          created_date?: string
          id?: string
          lesson?: string | null
          metadata?: Json | null
          position: number
          updated_by?: string | null
          updated_date?: string
        }
        Update: {
          activity?: string | null
          created_by?: string | null
          created_date?: string
          id?: string
          lesson?: string | null
          metadata?: Json | null
          position?: number
          updated_by?: string | null
          updated_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_activity_activity_fkey"
            columns: ["activity"]
            isOneToOne: false
            referencedRelation: "activity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_activity_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_activity_lesson_fkey"
            columns: ["lesson"]
            isOneToOne: false
            referencedRelation: "lesson"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_activity_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_session: {
        Row: {
          _user: string | null
          created_by: string | null
          created_date: string
          id: string
          lesson: string | null
          metadata: Json | null
          updated_by: string | null
          updated_date: string
        }
        Insert: {
          _user?: string | null
          created_by?: string | null
          created_date?: string
          id?: string
          lesson?: string | null
          metadata?: Json | null
          updated_by?: string | null
          updated_date?: string
        }
        Update: {
          _user?: string | null
          created_by?: string | null
          created_date?: string
          id?: string
          lesson?: string | null
          metadata?: Json | null
          updated_by?: string | null
          updated_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_session__user_fkey"
            columns: ["_user"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_session_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_session_lesson_fkey"
            columns: ["lesson"]
            isOneToOne: false
            referencedRelation: "lesson"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_session_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
        ]
      }
      memauth: {
        Row: {
          access_level: string
          created_by: string | null
          created_date: string
          id: string
          is_public: boolean | null
          principal_bot_id: string | null
          principal_group_id: string | null
          principal_id: string | null
          principal_type: Database["public"]["Enums"]["agent_type"] | null
          principal_user_id: string | null
          resource_entity_id: string
          resource_entity_type: string | null
          updated_by: string | null
          updated_date: string | null
        }
        Insert: {
          access_level: string
          created_by?: string | null
          created_date?: string
          id?: string
          is_public?: boolean | null
          principal_bot_id?: string | null
          principal_group_id?: string | null
          principal_id?: string | null
          principal_type?: Database["public"]["Enums"]["agent_type"] | null
          principal_user_id?: string | null
          resource_entity_id: string
          resource_entity_type?: string | null
          updated_by?: string | null
          updated_date?: string | null
        }
        Update: {
          access_level?: string
          created_by?: string | null
          created_date?: string
          id?: string
          is_public?: boolean | null
          principal_bot_id?: string | null
          principal_group_id?: string | null
          principal_id?: string | null
          principal_type?: Database["public"]["Enums"]["agent_type"] | null
          principal_user_id?: string | null
          resource_entity_id?: string
          resource_entity_type?: string | null
          updated_by?: string | null
          updated_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "memauth_principal_bot_id_fkey"
            columns: ["principal_bot_id"]
            isOneToOne: false
            referencedRelation: "bot"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memauth_principal_group_id_fkey"
            columns: ["principal_group_id"]
            isOneToOne: false
            referencedRelation: "group"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memauth_principal_user_id_fkey"
            columns: ["principal_user_id"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
        ]
      }
      member_authorization: {
        Row: {
          access_level: string
          agent_id: string | null
          agent_type: Database["public"]["Enums"]["agent_type"] | null
          bot_id: string | null
          created_by: string | null
          created_date: string
          granted_bot_id: string | null
          granted_chat_id: string | null
          granted_entity_id: string | null
          granted_entity_type: string | null
          granted_group_id: string | null
          group_id: string | null
          id: string
          is_base_access_level: boolean | null
          updated_by: string | null
          updated_date: string | null
          user_id: string | null
        }
        Insert: {
          access_level: string
          agent_id?: string | null
          agent_type?: Database["public"]["Enums"]["agent_type"] | null
          bot_id?: string | null
          created_by?: string | null
          created_date?: string
          granted_bot_id?: string | null
          granted_chat_id?: string | null
          granted_entity_id?: string | null
          granted_entity_type?: string | null
          granted_group_id?: string | null
          group_id?: string | null
          id?: string
          is_base_access_level?: boolean | null
          updated_by?: string | null
          updated_date?: string | null
          user_id?: string | null
        }
        Update: {
          access_level?: string
          agent_id?: string | null
          agent_type?: Database["public"]["Enums"]["agent_type"] | null
          bot_id?: string | null
          created_by?: string | null
          created_date?: string
          granted_bot_id?: string | null
          granted_chat_id?: string | null
          granted_entity_id?: string | null
          granted_entity_type?: string | null
          granted_group_id?: string | null
          group_id?: string | null
          id?: string
          is_base_access_level?: boolean | null
          updated_by?: string | null
          updated_date?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_authorization_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "bot"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_authorization_granted_bot_id_fkey"
            columns: ["granted_bot_id"]
            isOneToOne: false
            referencedRelation: "bot"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_authorization_granted_chat_id_fkey"
            columns: ["granted_chat_id"]
            isOneToOne: false
            referencedRelation: "chat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_authorization_granted_group_id_fkey"
            columns: ["granted_group_id"]
            isOneToOne: false
            referencedRelation: "group"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_authorization_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "group"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_authorization_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_subscription: {
        Row: {
          created_by: string | null
          created_date: string
          daily_streak: boolean
          id: string
          rsn_user_id: string
          updated_by: string | null
          updated_date: string
        }
        Insert: {
          created_by?: string | null
          created_date?: string
          daily_streak?: boolean
          id?: string
          rsn_user_id: string
          updated_by?: string | null
          updated_date?: string
        }
        Update: {
          created_by?: string | null
          created_date?: string
          daily_streak?: boolean
          id?: string
          rsn_user_id?: string
          updated_by?: string | null
          updated_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_subscription_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_subscription_rsn_user_id_fkey"
            columns: ["rsn_user_id"]
            isOneToOne: true
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_subscription_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
        ]
      }
      operation_log: {
        Row: {
          entity_id: string | null
          event_date: string
          id: string
          jsonb_diff: Json | null
          operation_level: string | null
          operation_type: string | null
          operation_when: string | null
          process_status:
            | Database["public"]["Enums"]["operation_log_process_status_enum"]
            | null
          processed_date: string | null
          rsn_user_id: string | null
          table_name: string | null
          trigger_name: string | null
        }
        Insert: {
          entity_id?: string | null
          event_date?: string
          id?: string
          jsonb_diff?: Json | null
          operation_level?: string | null
          operation_type?: string | null
          operation_when?: string | null
          process_status?:
            | Database["public"]["Enums"]["operation_log_process_status_enum"]
            | null
          processed_date?: string | null
          rsn_user_id?: string | null
          table_name?: string | null
          trigger_name?: string | null
        }
        Update: {
          entity_id?: string | null
          event_date?: string
          id?: string
          jsonb_diff?: Json | null
          operation_level?: string | null
          operation_type?: string | null
          operation_when?: string | null
          process_status?:
            | Database["public"]["Enums"]["operation_log_process_status_enum"]
            | null
          processed_date?: string | null
          rsn_user_id?: string | null
          table_name?: string | null
          trigger_name?: string | null
        }
        Relationships: []
      }
      partial_skill: {
        Row: {
          created_by: string | null
          created_date: string | null
          emoji: string
          goals: string[] | null
          id: string
          pages: string[] | null
          skill_description: string
          skill_id: string | null
          skill_name: string
          updated_by: string | null
          updated_date: string | null
          user_input: string
          user_level: string
        }
        Insert: {
          created_by?: string | null
          created_date?: string | null
          emoji: string
          goals?: string[] | null
          id?: string
          pages?: string[] | null
          skill_description: string
          skill_id?: string | null
          skill_name: string
          updated_by?: string | null
          updated_date?: string | null
          user_input: string
          user_level: string
        }
        Update: {
          created_by?: string | null
          created_date?: string | null
          emoji?: string
          goals?: string[] | null
          id?: string
          pages?: string[] | null
          skill_description?: string
          skill_id?: string | null
          skill_name?: string
          updated_by?: string | null
          updated_date?: string | null
          user_input?: string
          user_level?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_skill_id"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skill"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partial_skill_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partial_skill_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
        ]
      }
      permission: {
        Row: {
          created_by: string | null
          created_date: string
          description: string | null
          permission_code: string
          updated_by: string | null
          updated_date: string
        }
        Insert: {
          created_by?: string | null
          created_date?: string
          description?: string | null
          permission_code: string
          updated_by?: string | null
          updated_date?: string
        }
        Update: {
          created_by?: string | null
          created_date?: string
          description?: string | null
          permission_code?: string
          updated_by?: string | null
          updated_date?: string
        }
        Relationships: []
      }
      podcast: {
        Row: {
          created_by: string | null
          created_date: string
          for_skill_path: string[] | null
          for_user: string | null
          id: string
          is_shared_version: boolean
          metadata: Json | null
          original_podcast_id: string | null
          outline: Json | null
          podcast_type: string
          special_instructions: string | null
          title: string
          topic: string
          transcript: Json | null
          updated_by: string | null
          updated_date: string
        }
        Insert: {
          created_by?: string | null
          created_date?: string
          for_skill_path?: string[] | null
          for_user?: string | null
          id?: string
          is_shared_version?: boolean
          metadata?: Json | null
          original_podcast_id?: string | null
          outline?: Json | null
          podcast_type: string
          special_instructions?: string | null
          title: string
          topic: string
          transcript?: Json | null
          updated_by?: string | null
          updated_date?: string
        }
        Update: {
          created_by?: string | null
          created_date?: string
          for_skill_path?: string[] | null
          for_user?: string | null
          id?: string
          is_shared_version?: boolean
          metadata?: Json | null
          original_podcast_id?: string | null
          outline?: Json | null
          podcast_type?: string
          special_instructions?: string | null
          title?: string
          topic?: string
          transcript?: Json | null
          updated_by?: string | null
          updated_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_original_podcast"
            columns: ["original_podcast_id"]
            isOneToOne: false
            referencedRelation: "podcast"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "podcast_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "podcast_for_user_fkey"
            columns: ["for_user"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "podcast_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
        ]
      }
      podcast_audio: {
        Row: {
          audio_file: string
          created_by: string | null
          created_date: string | null
          id: string
          podcast_line_id: string
          speed: number
          updated_by: string | null
          updated_date: string | null
        }
        Insert: {
          audio_file: string
          created_by?: string | null
          created_date?: string | null
          id?: string
          podcast_line_id: string
          speed: number
          updated_by?: string | null
          updated_date?: string | null
        }
        Update: {
          audio_file?: string
          created_by?: string | null
          created_date?: string | null
          id?: string
          podcast_line_id?: string
          speed?: number
          updated_by?: string | null
          updated_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "podcast_audio_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "podcast_audio_podcast_line_id_fkey"
            columns: ["podcast_line_id"]
            isOneToOne: false
            referencedRelation: "podcast_line"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "podcast_audio_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
        ]
      }
      podcast_line: {
        Row: {
          created_by: string | null
          created_date: string
          dialogue: string
          dig_deeper_topics: string[] | null
          id: string
          line_number: number
          podcast_id: string | null
          speaker: string
          updated_by: string | null
          updated_date: string
        }
        Insert: {
          created_by?: string | null
          created_date?: string
          dialogue: string
          dig_deeper_topics?: string[] | null
          id?: string
          line_number: number
          podcast_id?: string | null
          speaker: string
          updated_by?: string | null
          updated_date?: string
        }
        Update: {
          created_by?: string | null
          created_date?: string
          dialogue?: string
          dig_deeper_topics?: string[] | null
          id?: string
          line_number?: number
          podcast_id?: string | null
          speaker?: string
          updated_by?: string | null
          updated_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "podcast_line_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "podcast_line_podcast_id_fkey"
            columns: ["podcast_id"]
            isOneToOne: false
            referencedRelation: "podcast"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "podcast_line_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
        ]
      }
      podcast_queue_item: {
        Row: {
          created_at: string | null
          for_user: string
          id: string
          podcast_id: string
          position: number
        }
        Insert: {
          created_at?: string | null
          for_user: string
          id?: string
          podcast_id: string
          position: number
        }
        Update: {
          created_at?: string | null
          for_user?: string
          id?: string
          podcast_id?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "podcast_queue_item_for_user_fkey"
            columns: ["for_user"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "podcast_queue_item_podcast_id_fkey"
            columns: ["podcast_id"]
            isOneToOne: false
            referencedRelation: "podcast"
            referencedColumns: ["id"]
          },
        ]
      }
      push_notification_subscription: {
        Row: {
          _endpoint: string
          auth: string
          created_by: string | null
          created_date: string
          id: string
          last_used_date: string | null
          p256dh: string
          rsn_user_id: string
          updated_by: string | null
          updated_date: string
          user_agent: string | null
        }
        Insert: {
          _endpoint: string
          auth: string
          created_by?: string | null
          created_date?: string
          id?: string
          last_used_date?: string | null
          p256dh: string
          rsn_user_id: string
          updated_by?: string | null
          updated_date?: string
          user_agent?: string | null
        }
        Update: {
          _endpoint?: string
          auth?: string
          created_by?: string | null
          created_date?: string
          id?: string
          last_used_date?: string | null
          p256dh?: string
          rsn_user_id?: string
          updated_by?: string | null
          updated_date?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "push_notification_subscription_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_notification_subscription_rsn_user_id_fkey"
            columns: ["rsn_user_id"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_notification_subscription_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
        ]
      }
      reference: {
        Row: {
          _ref_id: string
          created_by: string | null
          created_date: string
          id: string
          is_exact: boolean
          raw_content: string
          rsn_vec_id: string
          updated_by: string | null
          updated_date: string
        }
        Insert: {
          _ref_id: string
          created_by?: string | null
          created_date?: string
          id?: string
          is_exact?: boolean
          raw_content: string
          rsn_vec_id: string
          updated_by?: string | null
          updated_date?: string
        }
        Update: {
          _ref_id?: string
          created_by?: string | null
          created_date?: string
          id?: string
          is_exact?: boolean
          raw_content?: string
          rsn_vec_id?: string
          updated_by?: string | null
          updated_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "reference_rsn_vec_id_fkey"
            columns: ["rsn_vec_id"]
            isOneToOne: false
            referencedRelation: "rsn_vec"
            referencedColumns: ["id"]
          },
        ]
      }
      resource: {
        Row: {
          child_page_id: string | null
          child_snip_id: string | null
          created_by: string | null
          created_date: string
          id: string
          metadata: Json | null
          parent_course_id: string | null
          parent_podcast_id: string | null
          parent_skill_id: string | null
          updated_by: string | null
          updated_date: string
        }
        Insert: {
          child_page_id?: string | null
          child_snip_id?: string | null
          created_by?: string | null
          created_date?: string
          id?: string
          metadata?: Json | null
          parent_course_id?: string | null
          parent_podcast_id?: string | null
          parent_skill_id?: string | null
          updated_by?: string | null
          updated_date?: string
        }
        Update: {
          child_page_id?: string | null
          child_snip_id?: string | null
          created_by?: string | null
          created_date?: string
          id?: string
          metadata?: Json | null
          parent_course_id?: string | null
          parent_podcast_id?: string | null
          parent_skill_id?: string | null
          updated_by?: string | null
          updated_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_child_page_id_fkey"
            columns: ["child_page_id"]
            isOneToOne: false
            referencedRelation: "rsn_page"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_child_snip_id_fkey"
            columns: ["child_snip_id"]
            isOneToOne: false
            referencedRelation: "snip"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_parent_course_id_fkey"
            columns: ["parent_course_id"]
            isOneToOne: false
            referencedRelation: "course"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_parent_podcast_id_fkey"
            columns: ["parent_podcast_id"]
            isOneToOne: false
            referencedRelation: "podcast"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_parent_skill_id_fkey"
            columns: ["parent_skill_id"]
            isOneToOne: false
            referencedRelation: "skill"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
        ]
      }
      rsn_page: {
        Row: {
          _description: string | null
          _name: string | null
          body: string | null
          body_length: number | null
          body_sha_256: string | null
          created_by: string | null
          created_date: string
          file_type: string | null
          id: string
          metadata: Json | null
          original_filename: string | null
          parent: string | null
          storage_path: string | null
          updated_by: string | null
          updated_date: string
        }
        Insert: {
          _description?: string | null
          _name?: string | null
          body?: string | null
          body_length?: number | null
          body_sha_256?: string | null
          created_by?: string | null
          created_date?: string
          file_type?: string | null
          id?: string
          metadata?: Json | null
          original_filename?: string | null
          parent?: string | null
          storage_path?: string | null
          updated_by?: string | null
          updated_date?: string
        }
        Update: {
          _description?: string | null
          _name?: string | null
          body?: string | null
          body_length?: number | null
          body_sha_256?: string | null
          created_by?: string | null
          created_date?: string
          file_type?: string | null
          id?: string
          metadata?: Json | null
          original_filename?: string | null
          parent?: string | null
          storage_path?: string | null
          updated_by?: string | null
          updated_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "rsn_page_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rsn_page_parent_fkey"
            columns: ["parent"]
            isOneToOne: false
            referencedRelation: "rsn_page"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rsn_page_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
        ]
      }
      rsn_page_vec_queue: {
        Row: {
          created_by: string | null
          created_date: string
          id: string
          rsn_page_id: string | null
          updated_by: string | null
          updated_date: string
        }
        Insert: {
          created_by?: string | null
          created_date?: string
          id?: string
          rsn_page_id?: string | null
          updated_by?: string | null
          updated_date?: string
        }
        Update: {
          created_by?: string | null
          created_date?: string
          id?: string
          rsn_page_id?: string | null
          updated_by?: string | null
          updated_date?: string
        }
        Relationships: []
      }
      rsn_page_vector: {
        Row: {
          created_by: string | null
          created_date: string
          embedding: string | null
          id: string
          raw_content: string | null
          rsn_page_id: string | null
          rsn_page_offset: number
          updated_by: string | null
          updated_date: string
        }
        Insert: {
          created_by?: string | null
          created_date?: string
          embedding?: string | null
          id?: string
          raw_content?: string | null
          rsn_page_id?: string | null
          rsn_page_offset: number
          updated_by?: string | null
          updated_date?: string
        }
        Update: {
          created_by?: string | null
          created_date?: string
          embedding?: string | null
          id?: string
          raw_content?: string | null
          rsn_page_id?: string | null
          rsn_page_offset?: number
          updated_by?: string | null
          updated_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "rsn_page_vector_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rsn_page_vector_rsn_page_id_fkey"
            columns: ["rsn_page_id"]
            isOneToOne: false
            referencedRelation: "rsn_page"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rsn_page_vector_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
        ]
      }
      rsn_user: {
        Row: {
          _role: string | null
          auth_email: string | null
          auth_id: string
          family_name: string | null
          first_login_date: string | null
          given_name: string | null
          id: string | null
          last_login_date: string | null
          timezone: string
          username: string | null
        }
        Insert: {
          _role?: string | null
          auth_email?: string | null
          auth_id: string
          family_name?: string | null
          first_login_date?: string | null
          given_name?: string | null
          id?: string | null
          last_login_date?: string | null
          timezone?: string
          username?: string | null
        }
        Update: {
          _role?: string | null
          auth_email?: string | null
          auth_id?: string
          family_name?: string | null
          first_login_date?: string | null
          given_name?: string | null
          id?: string | null
          last_login_date?: string | null
          timezone?: string
          username?: string | null
        }
        Relationships: []
      }
      rsn_user_sysdata: {
        Row: {
          auth_email: string | null
          auth_id: string
          daily_xp_goal_celebration_time: string | null
          extra_license_info: Json | null
          has_onboarded: boolean | null
          id: string
          rsn_user_id: string | null
        }
        Insert: {
          auth_email?: string | null
          auth_id: string
          daily_xp_goal_celebration_time?: string | null
          extra_license_info?: Json | null
          has_onboarded?: boolean | null
          id?: string
          rsn_user_id?: string | null
        }
        Update: {
          auth_email?: string | null
          auth_id?: string
          daily_xp_goal_celebration_time?: string | null
          extra_license_info?: Json | null
          has_onboarded?: boolean | null
          id?: string
          rsn_user_id?: string | null
        }
        Relationships: []
      }
      rsn_vec: {
        Row: {
          _ref_id: string
          colname: string | null
          colpath: string[] | null
          colpath_str: string | null
          content_offset: number
          created_by: string | null
          created_date: string
          embedding: string | null
          embedding_openai_text_embedding_3_small: string | null
          id: string
          raw_content: string | null
          tablename: string | null
          updated_by: string | null
          updated_date: string
        }
        Insert: {
          _ref_id: string
          colname?: string | null
          colpath?: string[] | null
          colpath_str?: string | null
          content_offset: number
          created_by?: string | null
          created_date?: string
          embedding?: string | null
          embedding_openai_text_embedding_3_small?: string | null
          id?: string
          raw_content?: string | null
          tablename?: string | null
          updated_by?: string | null
          updated_date?: string
        }
        Update: {
          _ref_id?: string
          colname?: string | null
          colpath?: string[] | null
          colpath_str?: string | null
          content_offset?: number
          created_by?: string | null
          created_date?: string
          embedding?: string | null
          embedding_openai_text_embedding_3_small?: string | null
          id?: string
          raw_content?: string | null
          tablename?: string | null
          updated_by?: string | null
          updated_date?: string
        }
        Relationships: []
      }
      rsn_vec_config: {
        Row: {
          colname: string
          colpath: string[] | null
          id: string
          tablename: string
        }
        Insert: {
          colname: string
          colpath?: string[] | null
          id?: string
          tablename: string
        }
        Update: {
          colname?: string
          colpath?: string[] | null
          id?: string
          tablename?: string
        }
        Relationships: []
      }
      rsn_vec_queue: {
        Row: {
          _ref_id: string
          colname: string
          colpath: string[] | null
          colpath_str: string | null
          created_by: string | null
          created_date: string
          id: string
          tablename: string | null
          updated_by: string | null
          updated_date: string
        }
        Insert: {
          _ref_id: string
          colname: string
          colpath?: string[] | null
          colpath_str?: string | null
          created_by?: string | null
          created_date?: string
          id?: string
          tablename?: string | null
          updated_by?: string | null
          updated_date?: string
        }
        Update: {
          _ref_id?: string
          colname?: string
          colpath?: string[] | null
          colpath_str?: string | null
          created_by?: string | null
          created_date?: string
          id?: string
          tablename?: string | null
          updated_by?: string | null
          updated_date?: string
        }
        Relationships: []
      }
      rsncore_table_abbreviations: {
        Row: {
          abbreviation: string
          id: string
          tablename: string
        }
        Insert: {
          abbreviation: string
          id?: string
          tablename: string
        }
        Update: {
          abbreviation?: string
          id?: string
          tablename?: string
        }
        Relationships: []
      }
      skill: {
        Row: {
          _description: string | null
          _name: string
          _type: string | null
          colorinfo: Json | null
          context_page: string | null
          created_by: string | null
          created_date: string
          domain: string | null
          emoji: string | null
          for_user: string | null
          generated_from_skill_path: string[] | null
          id: string
          metadata: Json | null
          name_and_description: string | null
          processing_state:
            | Database["public"]["Enums"]["skill_processing_state"]
            | null
          reference_ids: string[] | null
          root_skill_id: string | null
          rsn_vec_ids: string[] | null
          updated_by: string | null
          updated_date: string
        }
        Insert: {
          _description?: string | null
          _name: string
          _type?: string | null
          colorinfo?: Json | null
          context_page?: string | null
          created_by?: string | null
          created_date?: string
          domain?: string | null
          emoji?: string | null
          for_user?: string | null
          generated_from_skill_path?: string[] | null
          id?: string
          metadata?: Json | null
          name_and_description?: string | null
          processing_state?:
            | Database["public"]["Enums"]["skill_processing_state"]
            | null
          reference_ids?: string[] | null
          root_skill_id?: string | null
          rsn_vec_ids?: string[] | null
          updated_by?: string | null
          updated_date?: string
        }
        Update: {
          _description?: string | null
          _name?: string
          _type?: string | null
          colorinfo?: Json | null
          context_page?: string | null
          created_by?: string | null
          created_date?: string
          domain?: string | null
          emoji?: string | null
          for_user?: string | null
          generated_from_skill_path?: string[] | null
          id?: string
          metadata?: Json | null
          name_and_description?: string | null
          processing_state?:
            | Database["public"]["Enums"]["skill_processing_state"]
            | null
          reference_ids?: string[] | null
          root_skill_id?: string | null
          rsn_vec_ids?: string[] | null
          updated_by?: string | null
          updated_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill__context_page__fkey"
            columns: ["context_page"]
            isOneToOne: false
            referencedRelation: "rsn_page"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_root_skill_id_fkey"
            columns: ["root_skill_id"]
            isOneToOne: false
            referencedRelation: "skill"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_link: {
        Row: {
          _type: string | null
          _weight: number | null
          created_by: string | null
          created_date: string
          downstream_skill: string | null
          id: string
          metadata: Json | null
          updated_by: string | null
          updated_date: string
          upstream_skill: string | null
        }
        Insert: {
          _type?: string | null
          _weight?: number | null
          created_by?: string | null
          created_date?: string
          downstream_skill?: string | null
          id?: string
          metadata?: Json | null
          updated_by?: string | null
          updated_date?: string
          upstream_skill?: string | null
        }
        Update: {
          _type?: string | null
          _weight?: number | null
          created_by?: string | null
          created_date?: string
          downstream_skill?: string | null
          id?: string
          metadata?: Json | null
          updated_by?: string | null
          updated_date?: string
          upstream_skill?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skill_link_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_link_downstream_skill_fkey"
            columns: ["downstream_skill"]
            isOneToOne: false
            referencedRelation: "skill"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_link_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_link_upstream_skill_fkey"
            columns: ["upstream_skill"]
            isOneToOne: false
            referencedRelation: "skill"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_module: {
        Row: {
          _name: string
          children_ids: string[] | null
          created_by: string | null
          created_date: string
          id: string
          position: number
          root_skill_id: string | null
          updated_by: string | null
          updated_date: string
        }
        Insert: {
          _name: string
          children_ids?: string[] | null
          created_by?: string | null
          created_date?: string
          id?: string
          position: number
          root_skill_id?: string | null
          updated_by?: string | null
          updated_date?: string
        }
        Update: {
          _name?: string
          children_ids?: string[] | null
          created_by?: string | null
          created_date?: string
          id?: string
          position?: number
          root_skill_id?: string | null
          updated_by?: string | null
          updated_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_module_root_skill_id_fkey"
            columns: ["root_skill_id"]
            isOneToOne: false
            referencedRelation: "skill"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_page: {
        Row: {
          created_by: string | null
          created_date: string
          id: string
          rsn_page_id: string
          skill_id: string
          updated_by: string | null
          updated_date: string
        }
        Insert: {
          created_by?: string | null
          created_date?: string
          id?: string
          rsn_page_id: string
          skill_id: string
          updated_by?: string | null
          updated_date?: string
        }
        Update: {
          created_by?: string | null
          created_date?: string
          id?: string
          rsn_page_id?: string
          skill_id?: string
          updated_by?: string | null
          updated_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_page_rsn_page_id_fkey"
            columns: ["rsn_page_id"]
            isOneToOne: false
            referencedRelation: "rsn_page"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_page_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skill"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_set: {
        Row: {
          _description: string | null
          _name: string | null
          created_by: string | null
          created_date: string
          for_user: string | null
          id: string
          metadata: Json | null
          updated_by: string | null
          updated_date: string
        }
        Insert: {
          _description?: string | null
          _name?: string | null
          created_by?: string | null
          created_date?: string
          for_user?: string | null
          id?: string
          metadata?: Json | null
          updated_by?: string | null
          updated_date?: string
        }
        Update: {
          _description?: string | null
          _name?: string | null
          created_by?: string | null
          created_date?: string
          for_user?: string | null
          id?: string
          metadata?: Json | null
          updated_by?: string | null
          updated_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_set_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_set_for_user_fkey"
            columns: ["for_user"]
            isOneToOne: true
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_set_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_set_skill: {
        Row: {
          created_by: string | null
          created_date: string
          id: string
          metadata: Json | null
          skill: string | null
          skill_set: string | null
          updated_by: string | null
          updated_date: string
        }
        Insert: {
          created_by?: string | null
          created_date?: string
          id?: string
          metadata?: Json | null
          skill?: string | null
          skill_set?: string | null
          updated_by?: string | null
          updated_date?: string
        }
        Update: {
          created_by?: string | null
          created_date?: string
          id?: string
          metadata?: Json | null
          skill?: string | null
          skill_set?: string | null
          updated_by?: string | null
          updated_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_set_skill_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_set_skill_skill_fkey"
            columns: ["skill"]
            isOneToOne: false
            referencedRelation: "skill"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_set_skill_skill_set_fkey"
            columns: ["skill_set"]
            isOneToOne: false
            referencedRelation: "skill_set"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_set_skill_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
        ]
      }
      snip: {
        Row: {
          _name: string
          _owner: string | null
          _type: string
          auto_last_updated_date: string | null
          auto_param_update_attempts: number | null
          auto_param_update_state:
            | Database["public"]["Enums"]["extraction_state"]
            | null
          auto_summary: string | null
          auto_tags: string[] | null
          auto_title: string | null
          created_by: string | null
          created_date: string
          extraction_error: string | null
          extraction_info: Json | null
          extraction_state:
            | Database["public"]["Enums"]["extraction_state"]
            | null
          id: string
          metadata: Json | null
          page_id: string | null
          root_skill: string | null
          source_integration: string | null
          source_uniq_id: string | null
          source_url: string | null
          text_content: string | null
          updated_by: string | null
          updated_date: string
        }
        Insert: {
          _name?: string
          _owner?: string | null
          _type: string
          auto_last_updated_date?: string | null
          auto_param_update_attempts?: number | null
          auto_param_update_state?:
            | Database["public"]["Enums"]["extraction_state"]
            | null
          auto_summary?: string | null
          auto_tags?: string[] | null
          auto_title?: string | null
          created_by?: string | null
          created_date?: string
          extraction_error?: string | null
          extraction_info?: Json | null
          extraction_state?:
            | Database["public"]["Enums"]["extraction_state"]
            | null
          id?: string
          metadata?: Json | null
          page_id?: string | null
          root_skill?: string | null
          source_integration?: string | null
          source_uniq_id?: string | null
          source_url?: string | null
          text_content?: string | null
          updated_by?: string | null
          updated_date?: string
        }
        Update: {
          _name?: string
          _owner?: string | null
          _type?: string
          auto_last_updated_date?: string | null
          auto_param_update_attempts?: number | null
          auto_param_update_state?:
            | Database["public"]["Enums"]["extraction_state"]
            | null
          auto_summary?: string | null
          auto_tags?: string[] | null
          auto_title?: string | null
          created_by?: string | null
          created_date?: string
          extraction_error?: string | null
          extraction_info?: Json | null
          extraction_state?:
            | Database["public"]["Enums"]["extraction_state"]
            | null
          id?: string
          metadata?: Json | null
          page_id?: string | null
          root_skill?: string | null
          source_integration?: string | null
          source_uniq_id?: string | null
          source_url?: string | null
          text_content?: string | null
          updated_by?: string | null
          updated_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "snip__owner_fkey"
            columns: ["_owner"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "snip_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "snip_root_skill_fkey"
            columns: ["root_skill"]
            isOneToOne: false
            referencedRelation: "skill"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "snip_source_integration_fkey"
            columns: ["source_integration"]
            isOneToOne: false
            referencedRelation: "integration"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "snip_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_customers: {
        Row: {
          attrs: Json | null
          created: string | null
          description: string | null
          email: string | null
          id: string
          name: string | null
        }
        Insert: {
          attrs?: Json | null
          created?: string | null
          description?: string | null
          email?: string | null
          id: string
          name?: string | null
        }
        Update: {
          attrs?: Json | null
          created?: string | null
          description?: string | null
          email?: string | null
          id?: string
          name?: string | null
        }
        Relationships: []
      }
      stripe_products: {
        Row: {
          active: boolean | null
          attrs: Json | null
          created: string | null
          default_price: string | null
          description: string | null
          id: string
          name: string | null
          updated: string | null
        }
        Insert: {
          active?: boolean | null
          attrs?: Json | null
          created?: string | null
          default_price?: string | null
          description?: string | null
          id: string
          name?: string | null
          updated?: string | null
        }
        Update: {
          active?: boolean | null
          attrs?: Json | null
          created?: string | null
          default_price?: string | null
          description?: string | null
          id?: string
          name?: string | null
          updated?: string | null
        }
        Relationships: []
      }
      stripe_subscriptions: {
        Row: {
          attrs: Json | null
          canceled_at: string | null
          cancellation_reason: string | null
          currency: string | null
          current_period_end: string | null
          current_period_start: string | null
          customer: string | null
          id: string
          items: Json | null
          status: string | null
          stripe_product_id: string | null
        }
        Insert: {
          attrs?: Json | null
          canceled_at?: string | null
          cancellation_reason?: string | null
          currency?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          customer?: string | null
          id: string
          items?: Json | null
          status?: string | null
          stripe_product_id?: string | null
        }
        Update: {
          attrs?: Json | null
          canceled_at?: string | null
          cancellation_reason?: string | null
          currency?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          customer?: string | null
          id?: string
          items?: Json | null
          status?: string | null
          stripe_product_id?: string | null
        }
        Relationships: []
      }
      user_activity_feedback: {
        Row: {
          _description: string | null
          _tags: string[] | null
          _value: number | null
          activity: string | null
          created_by: string | null
          created_date: string
          id: string
          metadata: Json | null
          updated_by: string | null
          updated_date: string
        }
        Insert: {
          _description?: string | null
          _tags?: string[] | null
          _value?: number | null
          activity?: string | null
          created_by?: string | null
          created_date?: string
          id?: string
          metadata?: Json | null
          updated_by?: string | null
          updated_date?: string
        }
        Update: {
          _description?: string | null
          _tags?: string[] | null
          _value?: number | null
          activity?: string | null
          created_by?: string | null
          created_date?: string
          id?: string
          metadata?: Json | null
          updated_by?: string | null
          updated_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_feedback_activity_fkey"
            columns: ["activity"]
            isOneToOne: false
            referencedRelation: "activity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_activity_feedback_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_activity_feedback_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity_result: {
        Row: {
          _user: string | null
          activity: string | null
          created_by: string | null
          created_date: string
          id: string
          lesson_session_id: string | null
          metadata: Json | null
          result_data: Json | null
          score: number | null
          score_normalized: number | null
          skip_reason: string | null
          skipped: boolean | null
          submit_result: Json | null
          updated_by: string | null
          updated_date: string
        }
        Insert: {
          _user?: string | null
          activity?: string | null
          created_by?: string | null
          created_date?: string
          id?: string
          lesson_session_id?: string | null
          metadata?: Json | null
          result_data?: Json | null
          score?: number | null
          score_normalized?: number | null
          skip_reason?: string | null
          skipped?: boolean | null
          submit_result?: Json | null
          updated_by?: string | null
          updated_date?: string
        }
        Update: {
          _user?: string | null
          activity?: string | null
          created_by?: string | null
          created_date?: string
          id?: string
          lesson_session_id?: string | null
          metadata?: Json | null
          result_data?: Json | null
          score?: number | null
          score_normalized?: number | null
          skip_reason?: string | null
          skipped?: boolean | null
          submit_result?: Json | null
          updated_by?: string | null
          updated_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_result__user_fkey"
            columns: ["_user"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_activity_result_activity_fkey"
            columns: ["activity"]
            isOneToOne: false
            referencedRelation: "activity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_activity_result_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_activity_result_lesson_session_id_fkey"
            columns: ["lesson_session_id"]
            isOneToOne: false
            referencedRelation: "lesson_session"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_activity_result_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
        ]
      }
      user_history: {
        Row: {
          course_id: string | null
          created_by: string
          created_date: string
          id: string
          podcast_id: string | null
          rsn_user_id: string | null
          skill_id_visited: string | null
          updated_by: string
          updated_date: string
        }
        Insert: {
          course_id?: string | null
          created_by: string
          created_date?: string
          id?: string
          podcast_id?: string | null
          rsn_user_id?: string | null
          skill_id_visited?: string | null
          updated_by: string
          updated_date?: string
        }
        Update: {
          course_id?: string | null
          created_by?: string
          created_date?: string
          id?: string
          podcast_id?: string | null
          rsn_user_id?: string | null
          skill_id_visited?: string | null
          updated_by?: string
          updated_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_history_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_history_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_history_podcast_id_fkey"
            columns: ["podcast_id"]
            isOneToOne: false
            referencedRelation: "podcast"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_history_rsn_user_id_fkey"
            columns: ["rsn_user_id"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_history_skill_id_visited_fkey"
            columns: ["skill_id_visited"]
            isOneToOne: false
            referencedRelation: "skill"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_history_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
        ]
      }
      user_lesson_result: {
        Row: {
          _user: string | null
          created_by: string | null
          created_date: string
          id: string
          lesson: string | null
          metadata: Json | null
          updated_by: string | null
          updated_date: string
        }
        Insert: {
          _user?: string | null
          created_by?: string | null
          created_date?: string
          id?: string
          lesson?: string | null
          metadata?: Json | null
          updated_by?: string | null
          updated_date?: string
        }
        Update: {
          _user?: string | null
          created_by?: string | null
          created_date?: string
          id?: string
          lesson?: string | null
          metadata?: Json | null
          updated_by?: string | null
          updated_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_lesson_result__user_fkey"
            columns: ["_user"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_lesson_result_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_lesson_result_lesson_fkey"
            columns: ["lesson"]
            isOneToOne: false
            referencedRelation: "lesson"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_lesson_result_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profile: {
        Row: {
          badges: Json | null
          bio: string | null
          created_by: string | null
          created_date: string | null
          display_name: string | null
          id: string
          pinned_items: string[] | null
          profile_image_url: string | null
          rsn_user_id: string
          show_activity_graph: boolean | null
          updated_by: string | null
          updated_date: string | null
          username: string
        }
        Insert: {
          badges?: Json | null
          bio?: string | null
          created_by?: string | null
          created_date?: string | null
          display_name?: string | null
          id?: string
          pinned_items?: string[] | null
          profile_image_url?: string | null
          rsn_user_id: string
          show_activity_graph?: boolean | null
          updated_by?: string | null
          updated_date?: string | null
          username: string
        }
        Update: {
          badges?: Json | null
          bio?: string | null
          created_by?: string | null
          created_date?: string | null
          display_name?: string | null
          id?: string
          pinned_items?: string[] | null
          profile_image_url?: string | null
          rsn_user_id?: string
          show_activity_graph?: boolean | null
          updated_by?: string | null
          updated_date?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profile_rsn_user_id_fkey"
            columns: ["rsn_user_id"]
            isOneToOne: true
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
        ]
      }
      user_setting: {
        Row: {
          ai_about_me: string | null
          ai_instructions: string | null
          created_by: string | null
          created_date: string
          daily_xp_goal: number
          feelings: Json | null
          id: string
          metadata: Json | null
          podcast_playback_speed: number | null
          rsn_user: string
          temporary_daily_xp_goal: number | null
          temporary_daily_xp_goal_set_datetime: string | null
          ui_theme: string | null
          updated_by: string | null
          updated_date: string
        }
        Insert: {
          ai_about_me?: string | null
          ai_instructions?: string | null
          created_by?: string | null
          created_date?: string
          daily_xp_goal?: number
          feelings?: Json | null
          id?: string
          metadata?: Json | null
          podcast_playback_speed?: number | null
          rsn_user: string
          temporary_daily_xp_goal?: number | null
          temporary_daily_xp_goal_set_datetime?: string | null
          ui_theme?: string | null
          updated_by?: string | null
          updated_date?: string
        }
        Update: {
          ai_about_me?: string | null
          ai_instructions?: string | null
          created_by?: string | null
          created_date?: string
          daily_xp_goal?: number
          feelings?: Json | null
          id?: string
          metadata?: Json | null
          podcast_playback_speed?: number | null
          rsn_user?: string
          temporary_daily_xp_goal?: number | null
          temporary_daily_xp_goal_set_datetime?: string | null
          ui_theme?: string | null
          updated_by?: string | null
          updated_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_setting_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_setting_rsn_user_fkey"
            columns: ["rsn_user"]
            isOneToOne: true
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_setting_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
        ]
      }
      user_skill: {
        Row: {
          created_by: string | null
          created_date: string
          current_chapter: string | null
          id: string
          interest_reasons: string[] | null
          metadata: Json | null
          rsn_user: string
          self_assigned_level: string | null
          skill: string
          specifics: string[] | null
          updated_by: string | null
          updated_date: string
        }
        Insert: {
          created_by?: string | null
          created_date?: string
          current_chapter?: string | null
          id?: string
          interest_reasons?: string[] | null
          metadata?: Json | null
          rsn_user: string
          self_assigned_level?: string | null
          skill: string
          specifics?: string[] | null
          updated_by?: string | null
          updated_date?: string
        }
        Update: {
          created_by?: string | null
          created_date?: string
          current_chapter?: string | null
          id?: string
          interest_reasons?: string[] | null
          metadata?: Json | null
          rsn_user?: string
          self_assigned_level?: string | null
          skill?: string
          specifics?: string[] | null
          updated_by?: string | null
          updated_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_skill_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_skill_current_chapter_fkey"
            columns: ["current_chapter"]
            isOneToOne: false
            referencedRelation: "chapter"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_skill_rsn_user_fkey"
            columns: ["rsn_user"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_skill_skill_fkey"
            columns: ["skill"]
            isOneToOne: false
            referencedRelation: "skill"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_skill_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
        ]
      }
      user_skill_sysdata: {
        Row: {
          daily_xp: number
          highest_level_shown: number | null
          id: string
          last_daily_reset: string
          practice_score: number
          rsn_user: string | null
          skill: string | null
          total_xp: number
        }
        Insert: {
          daily_xp?: number
          highest_level_shown?: number | null
          id?: string
          last_daily_reset?: string
          practice_score?: number
          rsn_user?: string | null
          skill?: string | null
          total_xp?: number
        }
        Update: {
          daily_xp?: number
          highest_level_shown?: number | null
          id?: string
          last_daily_reset?: string
          practice_score?: number
          rsn_user?: string | null
          skill?: string | null
          total_xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_skill_sysdata_rsn_user_fkey"
            columns: ["rsn_user"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_skill_sysdata_skill_fkey"
            columns: ["skill"]
            isOneToOne: false
            referencedRelation: "skill"
            referencedColumns: ["id"]
          },
        ]
      }
      user_tour: {
        Row: {
          _user: string | null
          created_by: string | null
          created_date: string
          id: string
          metadata: Json | null
          tour_name: string | null
          tour_state: Json | null
          tour_status: Database["public"]["Enums"]["user_tour_status"] | null
          updated_by: string | null
          updated_date: string
        }
        Insert: {
          _user?: string | null
          created_by?: string | null
          created_date?: string
          id?: string
          metadata?: Json | null
          tour_name?: string | null
          tour_state?: Json | null
          tour_status?: Database["public"]["Enums"]["user_tour_status"] | null
          updated_by?: string | null
          updated_date?: string
        }
        Update: {
          _user?: string | null
          created_by?: string | null
          created_date?: string
          id?: string
          metadata?: Json | null
          tour_name?: string | null
          tour_state?: Json | null
          tour_status?: Database["public"]["Enums"]["user_tour_status"] | null
          updated_by?: string | null
          updated_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_tour__user_fkey"
            columns: ["_user"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_tour_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_tour_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "rsn_user"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      pg_all_foreign_keys: {
        Row: {
          fk_columns: unknown[] | null
          fk_constraint_name: unknown | null
          fk_schema_name: unknown | null
          fk_table_name: unknown | null
          fk_table_oid: unknown | null
          is_deferrable: boolean | null
          is_deferred: boolean | null
          match_type: string | null
          on_delete: string | null
          on_update: string | null
          pk_columns: unknown[] | null
          pk_constraint_name: unknown | null
          pk_index_name: unknown | null
          pk_schema_name: unknown | null
          pk_table_name: unknown | null
          pk_table_oid: unknown | null
        }
        Relationships: []
      }
      tap_funky: {
        Row: {
          args: string | null
          is_definer: boolean | null
          is_strict: boolean | null
          is_visible: boolean | null
          kind: unknown | null
          langoid: unknown | null
          name: unknown | null
          oid: unknown | null
          owner: unknown | null
          returns: string | null
          returns_set: boolean | null
          schema: unknown | null
          volatility: string | null
        }
        Relationships: []
      }
      user_current_licenses: {
        Row: {
          auth_id: string | null
          license_type: string | null
          source: string | null
        }
        Relationships: []
      }
      user_daily_feature_usage: {
        Row: {
          count_in_period: number | null
          feature_id: string | null
          period_end: string | null
          period_start: string | null
          user_id: string | null
        }
        Relationships: []
      }
      vw_activity_memauth: {
        Row: {
          access_level: string | null
          activity_id: string | null
          is_public: boolean | null
          memauth_id: string | null
          permissions: string[] | null
          principal_id: string | null
          principal_type: Database["public"]["Enums"]["agent_type"] | null
        }
        Relationships: []
      }
      vw_course_memauth: {
        Row: {
          access_level: string | null
          course_id: string | null
          is_public: boolean | null
          memauth_id: string | null
          permissions: string[] | null
          principal_id: string | null
          principal_type: Database["public"]["Enums"]["agent_type"] | null
        }
        Relationships: []
      }
      vw_entity_permissions: {
        Row: {
          entity_id: string | null
          entity_type: string | null
          is_public: boolean | null
          permissions: string[] | null
          principal_id: string | null
        }
        Relationships: []
      }
      vw_entity_vec_permissions: {
        Row: {
          entity_id: string | null
          is_public: boolean | null
          permissions: string[] | null
          principal_id: string | null
          principal_type: Database["public"]["Enums"]["agent_type"] | null
          tablename: string | null
        }
        Relationships: []
      }
      vw_goal_memauth: {
        Row: {
          goal_id: string | null
          is_public: boolean | null
          permissions: string[] | null
          principal_id: string | null
          principal_type: Database["public"]["Enums"]["agent_type"] | null
        }
        Relationships: []
      }
      vw_lesson_memauth: {
        Row: {
          access_level: string | null
          is_public: boolean | null
          lesson_id: string | null
          memauth_id: string | null
          permissions: string[] | null
          principal_id: string | null
          principal_type: Database["public"]["Enums"]["agent_type"] | null
        }
        Relationships: []
      }
      vw_rsn_page_memauth: {
        Row: {
          is_public: boolean | null
          page_id: string | null
          permissions: string[] | null
          principal_id: string | null
          principal_type: Database["public"]["Enums"]["agent_type"] | null
        }
        Relationships: []
      }
      vw_skill_memauth: {
        Row: {
          is_public: boolean | null
          permissions: string[] | null
          principal_id: string | null
          principal_type: Database["public"]["Enums"]["agent_type"] | null
          skill_id: string | null
        }
        Relationships: []
      }
      vw_snip_memauth: {
        Row: {
          is_public: boolean | null
          permissions: string[] | null
          principal_id: string | null
          principal_type: Database["public"]["Enums"]["agent_type"] | null
          snip_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      _cleanup: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      _contract_on: {
        Args: {
          "": string
        }
        Returns: unknown
      }
      _currtest: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      _db_privs: {
        Args: Record<PropertyKey, never>
        Returns: unknown[]
      }
      _definer: {
        Args: {
          "": unknown
        }
        Returns: boolean
      }
      _dexists: {
        Args: {
          "": unknown
        }
        Returns: boolean
      }
      _expand_context: {
        Args: {
          "": string
        }
        Returns: string
      }
      _expand_on: {
        Args: {
          "": string
        }
        Returns: string
      }
      _expand_vol: {
        Args: {
          "": string
        }
        Returns: string
      }
      _ext_exists: {
        Args: {
          "": unknown
        }
        Returns: boolean
      }
      _extensions:
        | {
            Args: Record<PropertyKey, never>
            Returns: unknown[]
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown[]
          }
      _funkargs: {
        Args: {
          "": unknown[]
        }
        Returns: string
      }
      _get: {
        Args: {
          "": string
        }
        Returns: number
      }
      _get_db_owner: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      _get_dtype: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      _get_language_owner: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      _get_latest: {
        Args: {
          "": string
        }
        Returns: number[]
      }
      _get_note:
        | {
            Args: {
              "": number
            }
            Returns: string
          }
        | {
            Args: {
              "": string
            }
            Returns: string
          }
      _get_opclass_owner: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      _get_rel_owner: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      _get_schema_owner: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      _get_tablespace_owner: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      _get_type_owner: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      _got_func: {
        Args: {
          "": unknown
        }
        Returns: boolean
      }
      _grolist: {
        Args: {
          "": unknown
        }
        Returns: unknown[]
      }
      _has_group: {
        Args: {
          "": unknown
        }
        Returns: boolean
      }
      _has_role: {
        Args: {
          "": unknown
        }
        Returns: boolean
      }
      _has_user: {
        Args: {
          "": unknown
        }
        Returns: boolean
      }
      _inherited: {
        Args: {
          "": unknown
        }
        Returns: boolean
      }
      _is_schema: {
        Args: {
          "": unknown
        }
        Returns: boolean
      }
      _is_super: {
        Args: {
          "": unknown
        }
        Returns: boolean
      }
      _is_trusted: {
        Args: {
          "": unknown
        }
        Returns: boolean
      }
      _is_verbose: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      _lang: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      _opc_exists: {
        Args: {
          "": unknown
        }
        Returns: boolean
      }
      _parts: {
        Args: {
          "": unknown
        }
        Returns: unknown[]
      }
      _pg_sv_type_array: {
        Args: {
          "": unknown[]
        }
        Returns: unknown[]
      }
      _prokind: {
        Args: {
          p_oid: unknown
        }
        Returns: unknown
      }
      _query: {
        Args: {
          "": string
        }
        Returns: string
      }
      _refine_vol: {
        Args: {
          "": string
        }
        Returns: string
      }
      _relexists: {
        Args: {
          "": unknown
        }
        Returns: boolean
      }
      _returns: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      _strict: {
        Args: {
          "": unknown
        }
        Returns: boolean
      }
      _table_privs: {
        Args: Record<PropertyKey, never>
        Returns: unknown[]
      }
      _temptypes: {
        Args: {
          "": string
        }
        Returns: string
      }
      _todo: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      _vol: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      add_skill_xp: {
        Args: {
          user_id: string
          skill_id: string
          xp_amount: number
        }
        Returns: undefined
      }
      add_skills_to_user_skill_set: {
        Args: {
          p_add_ids?: string[]
          p_add_skills?: Json
          p_add_skill_resources?: Json
          p_rsn_user_id?: string
        }
        Returns: Json
      }
      add_to_podcast_queue: {
        Args: {
          p_topic: string
          p_special_instructions: string
          p_podcast_type: string
          p_desired_position?: number
          p_for_skill_path?: string[]
          p_from_podcast_id?: string
        }
        Returns: string
      }
      add_to_user_activity_set: {
        Args: {
          add_ids: string[]
        }
        Returns: Json
      }
      anon_key: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      base_url: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      bytea_to_text: {
        Args: {
          data: string
        }
        Returns: string
      }
      calculate_current_streak: {
        Args: {
          user_id: string
          input_skill_id: string
        }
        Returns: number
      }
      can: {
        Args: {
          "": unknown[]
        }
        Returns: string
      }
      casts_are: {
        Args: {
          "": string[]
        }
        Returns: string
      }
      clone_podcast: {
        Args: {
          orig_pod_id: string
        }
        Returns: string
      }
      col_is_null:
        | {
            Args: {
              schema_name: unknown
              table_name: unknown
              column_name: unknown
              description?: string
            }
            Returns: string
          }
        | {
            Args: {
              table_name: unknown
              column_name: unknown
              description?: string
            }
            Returns: string
          }
      col_not_null:
        | {
            Args: {
              schema_name: unknown
              table_name: unknown
              column_name: unknown
              description?: string
            }
            Returns: string
          }
        | {
            Args: {
              table_name: unknown
              column_name: unknown
              description?: string
            }
            Returns: string
          }
      collect_tap:
        | {
            Args: Record<PropertyKey, never>
            Returns: string
          }
        | {
            Args: {
              "": string[]
            }
            Returns: string
          }
      convert_to_rsn_user_id: {
        Args: {
          p_user_id: string
        }
        Returns: string
      }
      create_rsn_user_from_token: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      crn_cleanup_daily_xp_and_goals: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cur_user_stripe_customer_id: {
        Args: {
          mock?: string
        }
        Returns: string
      }
      current_rsn_user_id: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      current_user_has_password: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      diag:
        | {
            Args: Record<PropertyKey, never>
            Returns: string
          }
        | {
            Args: Record<PropertyKey, never>
            Returns: string
          }
        | {
            Args: {
              msg: string
            }
            Returns: string
          }
        | {
            Args: {
              msg: unknown
            }
            Returns: string
          }
      diag_test_name: {
        Args: {
          "": string
        }
        Returns: string
      }
      do_tap:
        | {
            Args: Record<PropertyKey, never>
            Returns: string[]
          }
        | {
            Args: {
              "": string
            }
            Returns: string[]
          }
        | {
            Args: {
              "": unknown
            }
            Returns: string[]
          }
      domains_are: {
        Args: {
          "": unknown[]
        }
        Returns: string
      }
      email_for_rsn_user: {
        Args: {
          rsn_user_id: string
        }
        Returns: string
      }
      emails_match: {
        Args: {
          first_email: string
          second_email: string
        }
        Returns: boolean
      }
      enums_are: {
        Args: {
          "": unknown[]
        }
        Returns: string
      }
      env_name: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      extensions_are: {
        Args: {
          "": unknown[]
        }
        Returns: string
      }
      f_raise: {
        Args: {
          "": string
        }
        Returns: undefined
      }
      fail:
        | {
            Args: Record<PropertyKey, never>
            Returns: string
          }
        | {
            Args: {
              "": string
            }
            Returns: string
          }
      findfuncs: {
        Args: {
          "": string
        }
        Returns: string[]
      }
      finish: {
        Args: {
          exception_on_failure?: boolean
        }
        Returns: string[]
      }
      foreign_tables_are: {
        Args: {
          "": unknown[]
        }
        Returns: string
      }
      functions_are: {
        Args: {
          "": unknown[]
        }
        Returns: string
      }
      generate_display_name: {
        Args: {
          given_name: string
          family_name: string
        }
        Returns: string
      }
      generate_typed_uuid: {
        Args: {
          type_prefix: string
        }
        Returns: string
      }
      generate_username: {
        Args: {
          given_name: string
          family_name: string
        }
        Returns: string
      }
      get_activities_for_skill_paths: {
        Args: {
          p_skill_paths: Json
          p_generated_for_user?: string
          p_activity_type?: string
        }
        Returns: {
          _name: string
          _type: string | null
          created_by: string | null
          created_date: string
          gen_instructions: string | null
          generated_for_skill_paths: Json | null
          generated_for_user: string | null
          id: string
          metadata: Json | null
          source: string | null
          type_config: Json | null
          updated_by: string | null
          updated_date: string
        }[]
      }
      get_child_pages: {
        Args: {
          parent_page_ids: string[]
        }
        Returns: {
          id: string
          _name: string
          metadata: Json
          body: string
          parent: string
          body_length: number
          body_sha_256: string
          created_date: string
          updated_date: string
          created_by: string
          updated_by: string
        }[]
      }
      get_courses_for_user: {
        Args: {
          p_principal_id: string
          p_course_id?: string
        }
        Returns: {
          memauth_id: string
          principal_id: string
          principal_type: Database["public"]["Enums"]["agent_type"]
          course_id: string
          access_level: string
          permissions: string[]
          is_public: boolean
          course_name: string
          course_description: string
          course_root_skill: string
          course_created_date: string
          course_updated_date: string
          course_created_by: string
          course_updated_by: string
          course_cover_image_url: string
        }[]
      }
      get_downstream_skills_with_scores: {
        Args: {
          user_id: string
          input_skill_id: string
          start_date?: string
          end_date?: string
        }
        Returns: {
          skill_id: string
          skill_name: string
          path_from: string[]
          path_from_links: string[]
          min_normalized_score_downstream: number
          max_normalized_score_downstream: number
          average_normalized_score_downstream: number
          stddev_normalized_score_downstream: number
          activity_result_count_downstream: number
          all_scores: number[]
          num_downstream_skills: number
          level_on_parent: string
          level_path: string[]
        }[]
      }
      get_linked_skills: {
        Args: {
          user_id: string
          input_skill_id: string
          direction?: string
        }
        Returns: {
          skill_id: string
          skill_name: string
          skill_emoji: string
          skill_links: Json[]
        }[]
      }
      get_linked_skills_with_path: {
        Args: {
          skill_id: string
          direction: string
        }
        Returns: {
          linked_skill_id: string
          path_to_linked_skill: string[]
          skill_link_ids: string[]
        }[]
      }
      get_linked_skills_with_scores: {
        Args: {
          user_id: string
          input_skill_id: string
          start_date?: string
          end_date?: string
          ignore_activity_ids?: string[]
        }
        Returns: {
          skill_id: string
          skill_name: string
          path_to: string[]
          path_to_links: string[]
          min_normalized_score_upstream: number
          max_normalized_score_upstream: number
          average_normalized_score_upstream: number
          stddev_normalized_score_upstream: number
          activity_result_count_upstream: number
          all_scores: number[]
          num_upstream_skills: number
          level_on_parent: string
          level_path: string[]
        }[]
      }
      get_linked_skills_with_scores_v2: {
        Args: {
          user_id: string
          input_skill_id: string
          direction?: string
        }
        Returns: {
          skill_id: string
          skill_name: string
          skill_emoji: string
          skill_links: Json[]
          user_activity_result_ids: string[]
          skill_score: number
        }[]
      }
      get_normal_user_id: {
        Args: {
          p_user_id: string
        }
        Returns: string
      }
      get_or_create_email_subscription: {
        Args: {
          p_user_id: string
        }
        Returns: {
          account_updates: boolean | null
          created_by: string | null
          created_date: string
          edtech_updates: boolean
          id: string
          newsletter: boolean
          product_updates: boolean
          resend_synced: boolean
          rsn_user_id: string | null
          updated_by: string | null
          updated_date: string
        }[]
      }
      get_or_create_notification_subscription: {
        Args: {
          p_user_id: string
        }
        Returns: {
          created_by: string | null
          created_date: string
          daily_streak: boolean
          id: string
          rsn_user_id: string
          updated_by: string | null
          updated_date: string
        }[]
      }
      get_skill_pages: {
        Args: {
          skillid: string
          parentskillids?: string[]
        }
        Returns: {
          id: string
          skill_id: string
          rsn_page_id: string
          page_id: string
          page_name: string
          page_body: string
        }[]
      }
      get_subscribed_user_info: {
        Args: {
          groups: string[]
        }
        Returns: {
          id: string
          auth_email: string
          given_name: string
          family_name: string
        }[]
      }
      get_tablename_from_abbreviation: {
        Args: {
          input_abbreviation: string
        }
        Returns: string
      }
      get_total_user_xp: {
        Args: {
          user_id: string
        }
        Returns: {
          total_xp: number
          daily_xp: number
        }[]
      }
      get_user_canceled_subscriptions: {
        Args: Record<PropertyKey, never>
        Returns: {
          stripe_subscription_id: string
          stripe_product_id: string
          stripe_product_name: string
          canceled_at: string
          cancellation_reason: string
        }[]
      }
      get_user_limits: {
        Args: Record<PropertyKey, never>
        Returns: {
          features: Json
          currentPlan: Json
        }[]
      }
      get_user_skill_scores: {
        Args: {
          user_id: string
          skill_ids: string[]
          start_date?: string
          end_date?: string
          ignore_activity_ids?: string[]
        }
        Returns: {
          skill_id: string
          average_normalized_score: number
          max_normalized_score: number
          min_normalized_score: number
        }[]
      }
      get_user_skill_scores_with_children: {
        Args: {
          user_id: string
          skill_ids: string[]
          start_date?: string
          end_date?: string
        }
        Returns: {
          skill_id: string
          skill_name: string
          average_normalized_score: number
          max_normalized_score: number
          min_normalized_score: number
          average_normalized_score_children: number
          max_normalized_score_children: number
          min_normalized_score_children: number
          activity_result_count: number
          activity_result_count_children: number
        }[]
      }
      get_user_stripe_subs_short: {
        Args: {
          mock?: Database["public"]["CompositeTypes"]["mock__get_user_stripe_subs_short"]
        }
        Returns: {
          stripe_subscription_id: string
          stripe_product_id: string
          stripe_product_name: string
          stripe_product_lookup_key: string
          current_period_start: string
          current_period_end: string
          status: string
          canceled_at: string
          cancellation_reason: string
        }[]
      }
      groups_are: {
        Args: {
          "": unknown[]
        }
        Returns: string
      }
      has_check: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      has_composite: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      has_domain: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      has_enum: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      has_extension: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      has_fk: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      has_foreign_table: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      has_function: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      has_group: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      has_inherited_tables: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      has_language: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      has_materialized_view: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      has_opclass: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      has_pk: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      has_relation: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      has_role: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      has_schema: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      has_sequence: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      has_table: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      has_tablespace: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      has_type: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      has_unique: {
        Args: {
          "": string
        }
        Returns: string
      }
      has_user: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      has_view: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      hasnt_composite: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      hasnt_domain: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      hasnt_enum: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      hasnt_extension: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      hasnt_fk: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      hasnt_foreign_table: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      hasnt_function: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      hasnt_group: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      hasnt_inherited_tables: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      hasnt_language: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      hasnt_materialized_view: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      hasnt_opclass: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      hasnt_pk: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      hasnt_relation: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      hasnt_role: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      hasnt_schema: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      hasnt_sequence: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      hasnt_table: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      hasnt_tablespace: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      hasnt_type: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      hasnt_user: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      hasnt_view: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      http: {
        Args: {
          request: Database["public"]["CompositeTypes"]["http_request"]
        }
        Returns: unknown
      }
      http_delete:
        | {
            Args: {
              uri: string
            }
            Returns: unknown
          }
        | {
            Args: {
              uri: string
              content: string
              content_type: string
            }
            Returns: unknown
          }
      http_get:
        | {
            Args: {
              uri: string
            }
            Returns: unknown
          }
        | {
            Args: {
              uri: string
              data: Json
            }
            Returns: unknown
          }
      http_head: {
        Args: {
          uri: string
        }
        Returns: unknown
      }
      http_header: {
        Args: {
          field: string
          value: string
        }
        Returns: Database["public"]["CompositeTypes"]["http_header"]
      }
      http_list_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: {
          curlopt: string
          value: string
        }[]
      }
      http_patch: {
        Args: {
          uri: string
          content: string
          content_type: string
        }
        Returns: unknown
      }
      http_post:
        | {
            Args: {
              uri: string
              content: string
              content_type: string
            }
            Returns: unknown
          }
        | {
            Args: {
              uri: string
              data: Json
            }
            Returns: unknown
          }
      http_put: {
        Args: {
          uri: string
          content: string
          content_type: string
        }
        Returns: unknown
      }
      http_reset_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      http_set_curlopt: {
        Args: {
          curlopt: string
          value: string
        }
        Returns: boolean
      }
      immutable_array_to_string: {
        Args: {
          arr: unknown
          delimiter: string
        }
        Returns: string
      }
      in_todo: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      index_is_primary: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      index_is_unique: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_aggregate: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      is_anon_user: {
        Args: {
          p_user_id: string
        }
        Returns: boolean
      }
      is_base_access_level: {
        Args: {
          _entity_type: string
          _access_level: string
        }
        Returns: boolean
      }
      is_clustered: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      is_definer: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      is_empty: {
        Args: {
          "": string
        }
        Returns: string
      }
      is_normal_function: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      is_partitioned: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      is_procedure: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      is_strict: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      is_superuser: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      is_valid_typed_uuid: {
        Args: {
          type_prefix: string
          to_test: unknown
        }
        Returns: boolean
      }
      is_window: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      isnt_aggregate: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      isnt_definer: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      isnt_empty: {
        Args: {
          "": string
        }
        Returns: string
      }
      isnt_normal_function: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      isnt_partitioned: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      isnt_procedure: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      isnt_strict: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      isnt_superuser: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      isnt_window: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      json_diff_values: {
        Args: {
          val1: Json
          val2: Json
        }
        Returns: Json
      }
      language_is_trusted: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      languages_are: {
        Args: {
          "": unknown[]
        }
        Returns: string
      }
      lesson_activity_add: {
        Args: {
          p_lesson_id: string
          p_activity_id: string
          p_metadata?: Json
          p_desired_position?: number
        }
        Returns: string
      }
      lesson_activity_remove: {
        Args: {
          p_lesson_activity_id: string
        }
        Returns: undefined
      }
      lesson_activity_reorder: {
        Args: {
          p_lesson_activity_id: string
          p_new_position: number
        }
        Returns: undefined
      }
      link_anon_user_to_user: {
        Args: {
          p_anon_user_id: string
          p_user_id: string
        }
        Returns: undefined
      }
      lives_ok: {
        Args: {
          "": string
        }
        Returns: string
      }
      login_jwt: {
        Args: {
          browser_timezone?: string
        }
        Returns: Database["public"]["CompositeTypes"]["login_jwt_return_type"]
      }
      match_rsn_page_vectors: {
        Args: {
          embedding: string
          match_threshold: number
          match_count: number
          min_content_length: number
          rsn_page_ids?: string[]
          allow_child_pages?: boolean
        }
        Returns: {
          id: string
          raw_content: string
          similarity: number
          rsn_page_id: string
        }[]
      }
      match_rsn_vec: {
        Args: {
          match_embedding: string
          match_threshold: number
          match_count: number
          min_content_length: number
          filter_tablename?: string
          filter_colname?: string
          filter_colpath?: string[]
          filter_ref_ids?: string[]
          embedding_column?: string
        }
        Returns: {
          id: string
          raw_content: string
          similarity: number
          _ref_id: string
          result_tablename: string
          result_colname: string
          result_colpath: string[]
          content_offset: number
        }[]
      }
      materialized_views_are: {
        Args: {
          "": unknown[]
        }
        Returns: string
      }
      no_plan: {
        Args: Record<PropertyKey, never>
        Returns: boolean[]
      }
      num_failed: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      ok: {
        Args: {
          "": boolean
        }
        Returns: string
      }
      opclasses_are: {
        Args: {
          "": unknown[]
        }
        Returns: string
      }
      operators_are: {
        Args: {
          "": string[]
        }
        Returns: string
      }
      os_name: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      pass:
        | {
            Args: Record<PropertyKey, never>
            Returns: string
          }
        | {
            Args: {
              "": string
            }
            Returns: string
          }
      pg_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      pg_version_num: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      pgtap_version: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      plan: {
        Args: {
          "": number
        }
        Returns: string
      }
      pop_from_podcast_queue: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      pop_snips_for_auto_param_update: {
        Args: {
          num_snips: number
        }
        Returns: {
          _name: string
          _owner: string | null
          _type: string
          auto_last_updated_date: string | null
          auto_param_update_attempts: number | null
          auto_param_update_state:
            | Database["public"]["Enums"]["extraction_state"]
            | null
          auto_summary: string | null
          auto_tags: string[] | null
          auto_title: string | null
          created_by: string | null
          created_date: string
          extraction_error: string | null
          extraction_info: Json | null
          extraction_state:
            | Database["public"]["Enums"]["extraction_state"]
            | null
          id: string
          metadata: Json | null
          page_id: string | null
          root_skill: string | null
          source_integration: string | null
          source_uniq_id: string | null
          source_url: string | null
          text_content: string | null
          updated_by: string | null
          updated_date: string
        }[]
      }
      reasonote_app_url: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      reorder_podcast_queue_item: {
        Args: {
          p_item_id: string
          p_new_position: number
        }
        Returns: undefined
      }
      reverse_name_for_rsn_user: {
        Args: {
          rsn_user_id: string
        }
        Returns: string
      }
      roles_are: {
        Args: {
          "": unknown[]
        }
        Returns: string
      }
      rsn_system_user_auth_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      rsn_system_user_id: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      runtests:
        | {
            Args: Record<PropertyKey, never>
            Returns: string[]
          }
        | {
            Args: {
              "": string
            }
            Returns: string[]
          }
        | {
            Args: {
              "": unknown
            }
            Returns: string[]
          }
      safe_unschedule_cron: {
        Args: {
          job_name: string
        }
        Returns: undefined
      }
      schemas_are: {
        Args: {
          "": unknown[]
        }
        Returns: string
      }
      sequences_are: {
        Args: {
          "": unknown[]
        }
        Returns: string
      }
      simple_auth_check: {
        Args: {
          created_by_id: string
          created_date: string
        }
        Returns: boolean
      }
      skip:
        | {
            Args: {
              "": number
            }
            Returns: string
          }
        | {
            Args: {
              "": string
            }
            Returns: string
          }
        | {
            Args: {
              why: string
              how_many: number
            }
            Returns: string
          }
      split_full_name: {
        Args: {
          full_name: string
        }
        Returns: {
          given_name: string
          family_name: string
        }[]
      }
      tables_are: {
        Args: {
          "": unknown[]
        }
        Returns: string
      }
      tablespaces_are: {
        Args: {
          "": unknown[]
        }
        Returns: string
      }
      text_to_bytea: {
        Args: {
          data: string
        }
        Returns: string
      }
      text_whitespace_or_null: {
        Args: {
          s: string
        }
        Returns: boolean
      }
      throw_if_not_local: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      throws_ok: {
        Args: {
          "": string
        }
        Returns: string
      }
      todo:
        | {
            Args: {
              how_many: number
            }
            Returns: boolean[]
          }
        | {
            Args: {
              how_many: number
              why: string
            }
            Returns: boolean[]
          }
        | {
            Args: {
              why: string
            }
            Returns: boolean[]
          }
        | {
            Args: {
              why: string
              how_many: number
            }
            Returns: boolean[]
          }
      todo_end: {
        Args: Record<PropertyKey, never>
        Returns: boolean[]
      }
      todo_start:
        | {
            Args: Record<PropertyKey, never>
            Returns: boolean[]
          }
        | {
            Args: {
              "": string
            }
            Returns: boolean[]
          }
      types_are: {
        Args: {
          "": unknown[]
        }
        Returns: string
      }
      update_chapter_root_skill_order: {
        Args: {
          chapter_id: string
          target_order: number
        }
        Returns: undefined
      }
      update_lesson_chapter_order: {
        Args: {
          lesson_id: string
          target_order: number
        }
        Returns: undefined
      }
      urlencode:
        | {
            Args: {
              data: Json
            }
            Returns: string
          }
        | {
            Args: {
              string: string
            }
            Returns: string
          }
        | {
            Args: {
              string: string
            }
            Returns: string
          }
      users_are: {
        Args: {
          "": unknown[]
        }
        Returns: string
      }
      validate_skill_module_children_ids: {
        Args: {
          p_children_ids: string[]
        }
        Returns: boolean
      }
      views_are: {
        Args: {
          "": unknown[]
        }
        Returns: string
      }
    }
    Enums: {
      agent_type: "user" | "bot" | "group"
      extraction_state:
        | "pending"
        | "processing"
        | "success"
        | "failed"
        | "unnecessary"
      operation_log_process_status_enum:
        | "pending"
        | "in_progress"
        | "complete"
        | "failed"
      skill_processing_state:
        | "CREATING_DAG"
        | "DAG_CREATION_FAILED"
        | "DAG_GENERATED"
        | "CREATING_MODULES"
        | "MODULE_CREATION_FAILED"
        | "SUCCESS"
      user_tour_status: "IN_PROGRESS" | "COMPLETED"
      webhook_format: "discord" | "slack"
    }
    CompositeTypes: {
      _time_trial_type: {
        a_time: number | null
      }
      http_header: {
        field: string | null
        value: string | null
      }
      http_request: {
        method: unknown | null
        uri: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content_type: string | null
        content: string | null
      }
      http_response: {
        status: number | null
        content_type: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content: string | null
      }
      login_jwt_return_type: {
        id: unknown | null
        has_password: boolean | null
      }
      mock__get_user_stripe_subs_short: {
        id: string | null
        product_lookup_key: string | null
        current_period_start: string | null
        current_period_end: string | null
        status: string | null
        canceled_at: string | null
        cancellation_reason: string | null
      }
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      agent_type: ["user", "bot", "group"],
      extraction_state: [
        "pending",
        "processing",
        "success",
        "failed",
        "unnecessary",
      ],
      operation_log_process_status_enum: [
        "pending",
        "in_progress",
        "complete",
        "failed",
      ],
      skill_processing_state: [
        "CREATING_DAG",
        "DAG_CREATION_FAILED",
        "DAG_GENERATED",
        "CREATING_MODULES",
        "MODULE_CREATION_FAILED",
        "SUCCESS",
      ],
      user_tour_status: ["IN_PROGRESS", "COMPLETED"],
      webhook_format: ["discord", "slack"],
    },
  },
} as const

