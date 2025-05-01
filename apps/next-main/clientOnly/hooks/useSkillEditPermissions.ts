import { useCallback } from 'react';
import { useSupabase } from '@/components/supabase/SupabaseProvider';
import { useRsnUser } from './useRsnUser';
import { Database } from '@reasonote/lib-sdk';

type courseForUser = Database['public']['Functions']['get_courses_for_user']['Returns'];

interface UseSkillEditPermissionsResult {
  checkSkillEditPermissions: (skillId?: string | null, courseId?: string | null) => Promise<{
    canEdit: boolean;
    error?: string;
  }>;
  loading: boolean;
}

export function useSkillEditPermissions(): UseSkillEditPermissionsResult {
  const { sb } = useSupabase();
  const { rsnUserId, loading } = useRsnUser();

  const checkSkillEditPermissions = useCallback(async (skillId?: string | null, courseId?: string | null) => {
    if (!rsnUserId) {
      return {
        canEdit: false,
        error: 'User not found!'
      };
    }

    try {
      let courseData: courseForUser | null = null;
      let error;
      // Check if skill is part of a course that the user has access to
      if (courseId) {
        ({ data: courseData, error } = await sb
          .rpc('get_courses_for_user', {
            p_principal_id: rsnUserId,
            p_course_id: courseId,
          }));
      } else if (skillId) {
        ({ data: courseData, error } = await sb
          .rpc('get_courses_for_user', {
            p_principal_id: rsnUserId,
          })
          .eq('course_root_skill', skillId));
      }

      if (error) {
        throw error;
      }

      if (courseData && courseData.length > 0) {
        // Check if user has edit permissions for any of the courses
        const hasEditPermission = courseData.some((course) =>
          course.permissions?.includes('course.UPDATE')
        );

        if (!hasEditPermission) {
          return {
            canEdit: false,
            error: 'You can only edit skills in courses you have edit access to!'
          };
        }
      }

      // If we get here, either:
      // 1. The skill isn't in any courses (so editing is allowed)
      // 2. The skill is in a course and the user has edit permissions
      return {
        canEdit: true
      };
    } catch (error) {
      console.error('Error checking course permissions:', error);
      return {
        canEdit: false,
        error: 'Error checking course permissions'
      };
    }
  }, [rsnUserId, sb]);

  return {
    checkSkillEditPermissions,
    loading
  };
}