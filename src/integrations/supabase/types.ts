export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          activity_type: string
          created_at: string
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          activity_type: string
          created_at?: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          activity_type?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      ad_campaigns: {
        Row: {
          ai_estimate: Json | null
          audience: Json
          body: string | null
          budget_total: number
          clicks: number
          cpm: number
          created_at: string
          cta_label: string
          cta_route: string | null
          currency: string
          ends_at: string | null
          id: string
          impressions: number
          media_url: string | null
          objective: string
          owner_id: string
          placement: string
          priority: number
          spend: number
          starts_at: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          ai_estimate?: Json | null
          audience?: Json
          body?: string | null
          budget_total?: number
          clicks?: number
          cpm?: number
          created_at?: string
          cta_label?: string
          cta_route?: string | null
          currency?: string
          ends_at?: string | null
          id?: string
          impressions?: number
          media_url?: string | null
          objective?: string
          owner_id: string
          placement?: string
          priority?: number
          spend?: number
          starts_at?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          ai_estimate?: Json | null
          audience?: Json
          body?: string | null
          budget_total?: number
          clicks?: number
          cpm?: number
          created_at?: string
          cta_label?: string
          cta_route?: string | null
          currency?: string
          ends_at?: string | null
          id?: string
          impressions?: number
          media_url?: string | null
          objective?: string
          owner_id?: string
          placement?: string
          priority?: number
          spend?: number
          starts_at?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      ad_events: {
        Row: {
          campaign_id: string
          created_at: string
          event: string
          id: string
          user_id: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          event: string
          id?: string
          user_id: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          event?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_action_requests: {
        Row: {
          action: string
          created_at: string
          decided_at: string | null
          id: string
          module: string
          payload: Json
          status: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          decided_at?: string | null
          id?: string
          module: string
          payload?: Json
          status?: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          decided_at?: string | null
          id?: string
          module?: string
          payload?: Json
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_consents: {
        Row: {
          created_at: string
          granted: boolean
          id: string
          scope: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          granted?: boolean
          id?: string
          scope: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          granted?: boolean
          id?: string
          scope?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_conversations: {
        Row: {
          created_at: string
          id: string
          language: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          language?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          language?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_memories: {
        Row: {
          content: string
          created_at: string
          id: string
          importance: number
          kind: string
          module: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          importance?: number
          kind?: string
          module?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          importance?: number
          kind?: string
          module?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_messages: {
        Row: {
          audio_url: string | null
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          audio_url?: string | null
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          audio_url?: string | null
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_safety_logs: {
        Row: {
          created_at: string
          id: string
          module: string
          reason: string | null
          user_id: string
          verdict: string
        }
        Insert: {
          created_at?: string
          id?: string
          module: string
          reason?: string | null
          user_id: string
          verdict: string
        }
        Update: {
          created_at?: string
          id?: string
          module?: string
          reason?: string | null
          user_id?: string
          verdict?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
        }
        Relationships: []
      }
      badges: {
        Row: {
          created_at: string
          description: string
          icon: string
          id: string
          name: string
          requirement_type: Database["public"]["Enums"]["badge_requirement"]
          requirement_value: number
          slug: string
        }
        Insert: {
          created_at?: string
          description: string
          icon: string
          id?: string
          name: string
          requirement_type: Database["public"]["Enums"]["badge_requirement"]
          requirement_value: number
          slug: string
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          name?: string
          requirement_type?: Database["public"]["Enums"]["badge_requirement"]
          requirement_value?: number
          slug?: string
        }
        Relationships: []
      }
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      communities: {
        Row: {
          avatar_url: string | null
          category: string | null
          city: string | null
          country: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          id: string
          is_paid: boolean
          language: string | null
          member_count: number
          monthly_price_coins: number
          name: string
          owner_id: string
          post_count: number
          rules: string | null
          slug: string
          type: Database["public"]["Enums"]["community_type"]
          updated_at: string
          verified: boolean
        }
        Insert: {
          avatar_url?: string | null
          category?: string | null
          city?: string | null
          country?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_paid?: boolean
          language?: string | null
          member_count?: number
          monthly_price_coins?: number
          name: string
          owner_id: string
          post_count?: number
          rules?: string | null
          slug: string
          type?: Database["public"]["Enums"]["community_type"]
          updated_at?: string
          verified?: boolean
        }
        Update: {
          avatar_url?: string | null
          category?: string | null
          city?: string | null
          country?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_paid?: boolean
          language?: string | null
          member_count?: number
          monthly_price_coins?: number
          name?: string
          owner_id?: string
          post_count?: number
          rules?: string | null
          slug?: string
          type?: Database["public"]["Enums"]["community_type"]
          updated_at?: string
          verified?: boolean
        }
        Relationships: []
      }
      community_invites: {
        Row: {
          community_id: string
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          max_uses: number | null
          token: string
          uses: number
        }
        Insert: {
          community_id: string
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          token: string
          uses?: number
        }
        Update: {
          community_id?: string
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          token?: string
          uses?: number
        }
        Relationships: [
          {
            foreignKeyName: "community_invites_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      community_join_requests: {
        Row: {
          community_id: string
          created_at: string
          id: string
          message: string | null
          status: string
          user_id: string
        }
        Insert: {
          community_id: string
          created_at?: string
          id?: string
          message?: string | null
          status?: string
          user_id: string
        }
        Update: {
          community_id?: string
          created_at?: string
          id?: string
          message?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_join_requests_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      community_members: {
        Row: {
          community_id: string
          id: string
          joined_at: string
          role: Database["public"]["Enums"]["community_member_role"]
          status: Database["public"]["Enums"]["community_member_status"]
          user_id: string
        }
        Insert: {
          community_id: string
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["community_member_role"]
          status?: Database["public"]["Enums"]["community_member_status"]
          user_id: string
        }
        Update: {
          community_id?: string
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["community_member_role"]
          status?: Database["public"]["Enums"]["community_member_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      community_post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          parent_comment_id: string | null
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_post_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "community_post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          comment_count: number
          community_id: string
          content: string | null
          created_at: string
          id: string
          is_announcement: boolean
          is_pinned: boolean
          like_count: number
          media_types: string[]
          media_urls: string[]
          poll: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          comment_count?: number
          community_id: string
          content?: string | null
          created_at?: string
          id?: string
          is_announcement?: boolean
          is_pinned?: boolean
          like_count?: number
          media_types?: string[]
          media_urls?: string[]
          poll?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          comment_count?: number
          community_id?: string
          content?: string | null
          created_at?: string
          id?: string
          is_announcement?: boolean
          is_pinned?: boolean
          like_count?: number
          media_types?: string[]
          media_urls?: string[]
          poll?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          is_important: boolean
          is_pinned: boolean
          joined_at: string
          last_read_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          is_important?: boolean
          is_pinned?: boolean
          joined_at?: string
          last_read_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          is_important?: boolean
          is_pinned?: boolean
          joined_at?: string
          last_read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      creator_revenue_logs: {
        Row: {
          amount: number
          country: string | null
          created_at: string
          currency: string
          id: string
          occurred_at: string
          source: string
          user_id: string
        }
        Insert: {
          amount?: number
          country?: string | null
          created_at?: string
          currency?: string
          id?: string
          occurred_at?: string
          source: string
          user_id: string
        }
        Update: {
          amount?: number
          country?: string | null
          created_at?: string
          currency?: string
          id?: string
          occurred_at?: string
          source?: string
          user_id?: string
        }
        Relationships: []
      }
      creator_stats: {
        Row: {
          created_at: string
          id: string
          level: number
          total_coins_received: number
          total_likes_received: number
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          created_at?: string
          id?: string
          level?: number
          total_coins_received?: number
          total_likes_received?: number
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          created_at?: string
          id?: string
          level?: number
          total_coins_received?: number
          total_likes_received?: number
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      cultural_countries: {
        Row: {
          attractions: string | null
          clothing: string | null
          code: string
          created_at: string
          customs: string | null
          festivals: string | null
          flag: string | null
          food: string | null
          history: string | null
          languages: string[] | null
          music: string | null
          name: string
          region: string | null
          summary: string | null
          updated_at: string
        }
        Insert: {
          attractions?: string | null
          clothing?: string | null
          code: string
          created_at?: string
          customs?: string | null
          festivals?: string | null
          flag?: string | null
          food?: string | null
          history?: string | null
          languages?: string[] | null
          music?: string | null
          name: string
          region?: string | null
          summary?: string | null
          updated_at?: string
        }
        Update: {
          attractions?: string | null
          clothing?: string | null
          code?: string
          created_at?: string
          customs?: string | null
          festivals?: string | null
          flag?: string | null
          food?: string | null
          history?: string | null
          languages?: string[] | null
          music?: string | null
          name?: string
          region?: string | null
          summary?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cultural_fashion_items: {
        Row: {
          country_code: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          occasion: string | null
          owner_id: string
        }
        Insert: {
          country_code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          occasion?: string | null
          owner_id: string
        }
        Update: {
          country_code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          occasion?: string | null
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cultural_fashion_items_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "cultural_countries"
            referencedColumns: ["code"]
          },
        ]
      }
      cultural_group_members: {
        Row: {
          created_at: string
          group_id: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cultural_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "cultural_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      cultural_groups: {
        Row: {
          country_code: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          id: string
          member_count: number
          name: string
          owner_id: string
          slug: string
          updated_at: string
        }
        Insert: {
          country_code?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          member_count?: number
          name: string
          owner_id: string
          slug: string
          updated_at?: string
        }
        Update: {
          country_code?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          member_count?: number
          name?: string
          owner_id?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cultural_groups_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "cultural_countries"
            referencedColumns: ["code"]
          },
        ]
      }
      cultural_museum_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          media_type: string
          media_url: string | null
          museum_id: string
          owner_id: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          media_type?: string
          media_url?: string | null
          museum_id: string
          owner_id: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          media_type?: string
          media_url?: string | null
          museum_id?: string
          owner_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "cultural_museum_items_museum_id_fkey"
            columns: ["museum_id"]
            isOneToOne: false
            referencedRelation: "cultural_museums"
            referencedColumns: ["id"]
          },
        ]
      }
      cultural_museums: {
        Row: {
          country_code: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          country_code?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          country_code?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cultural_museums_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "cultural_countries"
            referencedColumns: ["code"]
          },
        ]
      }
      cultural_music_tracks: {
        Row: {
          artist: string | null
          audio_url: string | null
          country_code: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          id: string
          instrument: string | null
          kind: string | null
          owner_id: string
          title: string
        }
        Insert: {
          artist?: string | null
          audio_url?: string | null
          country_code?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          instrument?: string | null
          kind?: string | null
          owner_id: string
          title: string
        }
        Update: {
          artist?: string | null
          audio_url?: string | null
          country_code?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          instrument?: string | null
          kind?: string | null
          owner_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "cultural_music_tracks_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "cultural_countries"
            referencedColumns: ["code"]
          },
        ]
      }
      cultural_oral_stories: {
        Row: {
          audio_url: string | null
          country_code: string | null
          created_at: string
          id: string
          owner_id: string
          storyteller: string | null
          title: string
          transcript: string | null
        }
        Insert: {
          audio_url?: string | null
          country_code?: string | null
          created_at?: string
          id?: string
          owner_id: string
          storyteller?: string | null
          title: string
          transcript?: string | null
        }
        Update: {
          audio_url?: string | null
          country_code?: string | null
          created_at?: string
          id?: string
          owner_id?: string
          storyteller?: string | null
          title?: string
          transcript?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cultural_oral_stories_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "cultural_countries"
            referencedColumns: ["code"]
          },
        ]
      }
      cultural_recipes: {
        Row: {
          country_code: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          ingredients: string[] | null
          owner_id: string
          steps: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          country_code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          ingredients?: string[] | null
          owner_id: string
          steps?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          country_code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          ingredients?: string[] | null
          owner_id?: string
          steps?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cultural_recipes_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "cultural_countries"
            referencedColumns: ["code"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      founder_code_templates: {
        Row: {
          code: string
          created_at: string
          id: string
          language: string
          sort_order: number
          title: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          language?: string
          sort_order?: number
          title: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          language?: string
          sort_order?: number
          title?: string
        }
        Relationships: []
      }
      founder_content: {
        Row: {
          body: string | null
          id: string
          section: string
          title: string | null
          updated_at: string
        }
        Insert: {
          body?: string | null
          id?: string
          section: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          body?: string | null
          id?: string
          section?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      founder_socials: {
        Row: {
          handle: string
          icon: string | null
          id: string
          platform: string
          sort_order: number
          url: string
        }
        Insert: {
          handle: string
          icon?: string | null
          id?: string
          platform: string
          sort_order?: number
          url: string
        }
        Update: {
          handle?: string
          icon?: string | null
          id?: string
          platform?: string
          sort_order?: number
          url?: string
        }
        Relationships: []
      }
      founder_songs: {
        Row: {
          created_at: string
          id: string
          sort_order: number
          title: string
          type: string | null
          url: string | null
          year: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          sort_order?: number
          title: string
          type?: string | null
          url?: string | null
          year?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          sort_order?: number
          title?: string
          type?: string | null
          url?: string | null
          year?: string | null
        }
        Relationships: []
      }
      hashtags: {
        Row: {
          created_at: string
          id: string
          tag: string
          use_count: number
        }
        Insert: {
          created_at?: string
          id?: string
          tag: string
          use_count?: number
        }
        Update: {
          created_at?: string
          id?: string
          tag?: string
          use_count?: number
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string | null
          conversation_id: string
          created_at: string
          duration_seconds: number | null
          id: string
          media_type: string | null
          media_url: string | null
          sender_id: string
        }
        Insert: {
          content?: string | null
          conversation_id: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          sender_id: string
        }
        Update: {
          content?: string | null
          conversation_id?: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string
          comment_id: string | null
          created_at: string
          id: string
          post_id: string | null
          read_at: string | null
          recipient_id: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Insert: {
          actor_id: string
          comment_id?: string | null
          created_at?: string
          id?: string
          post_id?: string | null
          read_at?: string | null
          recipient_id: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Update: {
          actor_id?: string
          comment_id?: string | null
          created_at?: string
          id?: string
          post_id?: string | null
          read_at?: string | null
          recipient_id?: string
          type?: Database["public"]["Enums"]["notification_type"]
        }
        Relationships: [
          {
            foreignKeyName: "notifications_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_methods: {
        Row: {
          created_at: string
          currency: string
          details: Json
          id: string
          is_default: boolean
          label: string | null
          type: string
          updated_at: string
          user_id: string
          verified: boolean
        }
        Insert: {
          created_at?: string
          currency?: string
          details?: Json
          id?: string
          is_default?: boolean
          label?: string | null
          type: string
          updated_at?: string
          user_id: string
          verified?: boolean
        }
        Update: {
          created_at?: string
          currency?: string
          details?: Json
          id?: string
          is_default?: boolean
          label?: string | null
          type?: string
          updated_at?: string
          user_id?: string
          verified?: boolean
        }
        Relationships: []
      }
      payout_otp_codes: {
        Row: {
          attempts: number
          code_hash: string
          consumed_at: string | null
          created_at: string
          expires_at: string
          id: string
          payload: Json | null
          purpose: string
          user_id: string
        }
        Insert: {
          attempts?: number
          code_hash: string
          consumed_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          payload?: Json | null
          purpose: string
          user_id: string
        }
        Update: {
          attempts?: number
          code_hash?: string
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          payload?: Json | null
          purpose?: string
          user_id?: string
        }
        Relationships: []
      }
      payout_requests: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          method_id: string | null
          note: string | null
          processed_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          method_id?: string | null
          note?: string | null
          processed_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          method_id?: string | null
          note?: string | null
          processed_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payout_requests_method_id_fkey"
            columns: ["method_id"]
            isOneToOne: false
            referencedRelation: "payout_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      post_bookmarks: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_bookmarks_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          like_count: number
          parent_comment_id: string | null
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          like_count?: number
          parent_comment_id?: string | null
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          like_count?: number
          parent_comment_id?: string | null
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_hashtags: {
        Row: {
          created_at: string
          hashtag_id: string
          id: string
          post_id: string
        }
        Insert: {
          created_at?: string
          hashtag_id: string
          id?: string
          post_id: string
        }
        Update: {
          created_at?: string
          hashtag_id?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_hashtags_hashtag_id_fkey"
            columns: ["hashtag_id"]
            isOneToOne: false
            referencedRelation: "hashtags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_hashtags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_shares: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_shares_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          caption: string | null
          comment_count: number
          created_at: string
          duration_seconds: number | null
          id: string
          is_trending: boolean
          like_count: number
          media_url: string | null
          share_count: number
          thumbnail_url: string | null
          type: Database["public"]["Enums"]["post_type"]
          updated_at: string
          user_id: string
          view_count: number
        }
        Insert: {
          caption?: string | null
          comment_count?: number
          created_at?: string
          duration_seconds?: number | null
          id?: string
          is_trending?: boolean
          like_count?: number
          media_url?: string | null
          share_count?: number
          thumbnail_url?: string | null
          type?: Database["public"]["Enums"]["post_type"]
          updated_at?: string
          user_id: string
          view_count?: number
        }
        Update: {
          caption?: string | null
          comment_count?: number
          created_at?: string
          duration_seconds?: number | null
          id?: string
          is_trending?: boolean
          like_count?: number
          media_url?: string | null
          share_count?: number
          thumbnail_url?: string | null
          type?: Database["public"]["Enums"]["post_type"]
          updated_at?: string
          user_id?: string
          view_count?: number
        }
        Relationships: []
      }
      profile_contacts: {
        Row: {
          created_at: string
          phone_country_code: string | null
          phone_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          phone_country_code?: string | null
          phone_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          phone_country_code?: string | null
          phone_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profile_featured_song: {
        Row: {
          artist: string | null
          audio_url: string
          cover_url: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          artist?: string | null
          audio_url: string
          cover_url?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          artist?: string | null
          audio_url?: string
          cover_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profile_gallery: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          media_type: string
          media_url: string
          position: number
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          media_type: string
          media_url: string
          position?: number
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          media_type?: string
          media_url?: string
          position?: number
          user_id?: string
        }
        Relationships: []
      }
      profile_stories: {
        Row: {
          caption: string | null
          created_at: string
          expires_at: string
          id: string
          media_type: string
          media_url: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          media_type: string
          media_url: string
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          media_type?: string
          media_url?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          banned: boolean
          bio: string | null
          cover_url: string | null
          created_at: string
          display_name: string | null
          facebook_url: string | null
          id: string
          instagram_url: string | null
          is_premium: boolean
          linkedin_url: string | null
          location: string | null
          preferred_language: string
          premium_until: string | null
          professional_badges: string[]
          telegram_url: string | null
          tiktok_url: string | null
          twitter_url: string | null
          updated_at: string
          user_id: string
          username: string | null
          verified: boolean
          website: string | null
          youtube_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          banned?: boolean
          bio?: string | null
          cover_url?: string | null
          created_at?: string
          display_name?: string | null
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          is_premium?: boolean
          linkedin_url?: string | null
          location?: string | null
          preferred_language?: string
          premium_until?: string | null
          professional_badges?: string[]
          telegram_url?: string | null
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
          verified?: boolean
          website?: string | null
          youtube_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          banned?: boolean
          bio?: string | null
          cover_url?: string | null
          created_at?: string
          display_name?: string | null
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          is_premium?: boolean
          linkedin_url?: string | null
          location?: string | null
          preferred_language?: string
          premium_until?: string | null
          professional_badges?: string[]
          telegram_url?: string | null
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
          verified?: boolean
          website?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          last_seen_at: string
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          last_seen_at?: string
          p256dh: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          last_seen_at?: string
          p256dh?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          reason: string
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["report_status"]
          target_id: string
          target_type: Database["public"]["Enums"]["report_target"]
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          target_id: string
          target_type: Database["public"]["Enums"]["report_target"]
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          target_id?: string
          target_type?: Database["public"]["Enums"]["report_target"]
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      user_devices: {
        Row: {
          created_at: string
          device_name: string | null
          device_token: string | null
          id: string
          last_active_at: string
          platform: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device_name?: string | null
          device_token?: string | null
          id?: string
          last_active_at?: string
          platform?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          device_name?: string | null
          device_token?: string | null
          id?: string
          last_active_at?: string
          platform?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          language: string
          notifications: Json
          preferences: Json
          privacy: Json
          theme: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          language?: string
          notifications?: Json
          preferences?: Json
          privacy?: Json
          theme?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          language?: string
          notifications?: Json
          preferences?: Json
          privacy?: Json
          theme?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_verifications: {
        Row: {
          created_at: string
          documents: Json | null
          id: string
          reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
          verification_type: string
        }
        Insert: {
          created_at?: string
          documents?: Json | null
          id?: string
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
          verification_type: string
        }
        Update: {
          created_at?: string
          documents?: Json | null
          id?: string
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          verification_type?: string
        }
        Relationships: []
      }
      wallet_accounts: {
        Row: {
          account_number: string
          created_at: string
          currency: string
          user_id: string
        }
        Insert: {
          account_number: string
          created_at?: string
          currency?: string
          user_id: string
        }
        Update: {
          account_number?: string
          created_at?: string
          currency?: string
          user_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          note: string | null
          post_id: string | null
          recipient_id: string
          sender_id: string | null
          type: Database["public"]["Enums"]["transaction_type"]
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          note?: string | null
          post_id?: string | null
          recipient_id: string
          sender_id?: string | null
          type?: Database["public"]["Enums"]["transaction_type"]
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          note?: string | null
          post_id?: string | null
          recipient_id?: string
          sender_id?: string | null
          type?: Database["public"]["Enums"]["transaction_type"]
        }
        Relationships: []
      }
      wallets: {
        Row: {
          balance: number
          created_at: string
          currency: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      award_xp: {
        Args: {
          _coins_delta?: number
          _likes_delta?: number
          _user_id: string
          _xp_delta: number
        }
        Returns: undefined
      }
      can_view_community: {
        Args: { _community_id: string; _user_id: string }
        Returns: boolean
      }
      can_view_community_posts: {
        Args: { _community_id: string; _user_id: string }
        Returns: boolean
      }
      check_and_award_badges: { Args: { _user_id: string }; Returns: undefined }
      ensure_creator_stats: { Args: { _user_id: string }; Returns: undefined }
      generate_account_number: { Args: never; Returns: string }
      get_community_invite_by_token: {
        Args: { _token: string }
        Returns: {
          community_id: string
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          max_uses: number | null
          token: string
          uses: number
        }
        SetofOptions: {
          from: "*"
          to: "community_invites"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_community_role: {
        Args: { _community_id: string; _user_id: string }
        Returns: Database["public"]["Enums"]["community_member_role"]
      }
      gift_post: {
        Args: { _amount: number; _note?: string; _post_id: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_community_member: {
        Args: { _community_id: string; _user_id: string }
        Returns: boolean
      }
      is_community_staff: {
        Args: { _community_id: string; _user_id: string }
        Returns: boolean
      }
      payout_summary: { Args: never; Returns: Json }
      record_ad_event: {
        Args: { _campaign_id: string; _event: string }
        Returns: undefined
      }
      start_direct_conversation: {
        Args: { other_user_id: string }
        Returns: string
      }
      transfer_coins: {
        Args: { _amount: number; _note?: string; _recipient_id: string }
        Returns: string
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "moderator"
        | "user"
        | "super_admin"
        | "developer"
        | "verified_creator"
        | "artist"
        | "business"
      badge_requirement:
        | "posts"
        | "likes_received"
        | "coins_received"
        | "level"
        | "followers"
      community_member_role:
        | "owner"
        | "admin"
        | "moderator"
        | "editor"
        | "expert"
        | "member"
        | "guest"
      community_member_status: "active" | "pending" | "banned"
      community_type:
        | "public"
        | "private"
        | "secret"
        | "business"
        | "school"
        | "fan_club"
        | "gaming"
        | "marketplace"
        | "local"
        | "verified_org"
      notification_type: "like" | "comment" | "comment_reply" | "follow"
      post_type: "video" | "image" | "text"
      report_status: "pending" | "reviewing" | "resolved" | "dismissed"
      report_target: "post" | "comment" | "user" | "message"
      transaction_type: "transfer" | "welcome_bonus" | "gift"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "moderator",
        "user",
        "super_admin",
        "developer",
        "verified_creator",
        "artist",
        "business",
      ],
      badge_requirement: [
        "posts",
        "likes_received",
        "coins_received",
        "level",
        "followers",
      ],
      community_member_role: [
        "owner",
        "admin",
        "moderator",
        "editor",
        "expert",
        "member",
        "guest",
      ],
      community_member_status: ["active", "pending", "banned"],
      community_type: [
        "public",
        "private",
        "secret",
        "business",
        "school",
        "fan_club",
        "gaming",
        "marketplace",
        "local",
        "verified_org",
      ],
      notification_type: ["like", "comment", "comment_reply", "follow"],
      post_type: ["video", "image", "text"],
      report_status: ["pending", "reviewing", "resolved", "dismissed"],
      report_target: ["post", "comment", "user", "message"],
      transaction_type: ["transfer", "welcome_bonus", "gift"],
    },
  },
} as const
