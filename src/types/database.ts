import type { Stage, StageEdge, Cohort, Opportunity } from './index';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          share_token: string | null;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          share_token?: string | null;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          share_token?: string | null;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'projects_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      project_data: {
        Row: {
          id: string;
          project_id: string;
          stages: Stage[];
          edges: StageEdge[];
          cohorts: Cohort[];
          opportunities: Opportunity[];
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          stages?: Stage[];
          edges?: StageEdge[];
          cohorts?: Cohort[];
          opportunities?: Opportunity[];
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          stages?: Stage[];
          edges?: StageEdge[];
          cohorts?: Cohort[];
          opportunities?: Opportunity[];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'project_data_project_id_fkey';
            columns: ['project_id'];
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_shared_project: {
        Args: { token: string };
        Returns: {
          project_id: string;
          name: string;
          stages: Stage[];
          edges: StageEdge[];
          cohorts: Cohort[];
          opportunities: Opportunity[];
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type Insertable<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type Updatable<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

export type Profile = Tables<'profiles'>;
export type Project = Tables<'projects'>;
export type ProjectData = Tables<'project_data'>;

export interface ProjectWithData extends Project {
  project_data: ProjectData | null;
}
