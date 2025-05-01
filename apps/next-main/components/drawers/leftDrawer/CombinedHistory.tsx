import {useCallback} from "react";

import {formatDistanceToNow} from "date-fns";
import {useRouter} from "next/navigation";

import {useRsnUser} from "@/clientOnly/hooks/useRsnUser";
import {
  ACSBDefaultInfiniteScroll,
} from "@/components/lists/ACSBDefaultInfiniteScroll";
import {SkillEmojiAvatar} from "@/components/skill/SkillEmojiAvatar";
import {Podcasts} from "@mui/icons-material";
import {
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  getUserHistoryDeepQueryDoc,
  OrderByDirection,
} from "@reasonote/lib-sdk-apollo-client";

interface CombinedHistoryProps {
  excludeId?: string;
  excludePodcasts?: boolean;
  currentId?: string | null;
}

export function CombinedHistory({ excludeId, excludePodcasts = true, currentId }: CombinedHistoryProps) {
  const { rsnUserId } = useRsnUser();
  const router = useRouter();

  const handleItemClick = useCallback((type: 'course' | 'skill' | 'podcast', itemId: string) => {
    if (type === 'course') {
      router.push(`/app/courses/${itemId}/view`);
    } else if (type === 'skill') {
      router.push(`/app/skills/${itemId}`);
    } else {
      router.push(`/app/podcast/${itemId}/player`);
    }
  }, [router]);

  const formatRelativeTime = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  return (
    <ACSBDefaultInfiniteScroll
      queryOpts={{
        query: getUserHistoryDeepQueryDoc,
        variables: {
          filter: {
            rsnUserId: { eq: rsnUserId },
          },
          orderBy: [{ createdDate: OrderByDirection.DescNullsLast }],
          first: 10,
        },
      }}
      getCollection={(data) => data.userHistoryCollection}
      getNodes={(collection) => collection.edges.map(edge => edge.node)}
      getChild={(node: any) => {
        // Skip rendering if this is the excluded item
        if ((excludeId && (
          (node.skillIdVisited && node.skillIdVisited === excludeId) ||
          (node.courseId && node.courseId === excludeId)
        )) || (excludePodcasts && node.podcastId)) {
          console.warn('Skipping item', node);
          return null;
        }

        // Check if this is the current item
        const isCurrentItem = currentId && (
          (node.skillIdVisited && node.skillIdVisited === currentId) ||
          (node.courseId && node.courseId === currentId) ||
          (node.podcastId && node.podcastId === currentId)
        );

        const itemId = node.courseId || node.skillIdVisited || node.podcastId;
        const itemName = node.courseId ? node.course?.name : node.skillIdVisited ? node.skill?.name : node.podcast?.topic;

        return (
          <Tooltip 
            key={itemId} 
            title={itemName}
          >
            <ListItemButton
              onClick={() => {
                if (node.skillIdVisited) {
                  handleItemClick('skill', node.skillIdVisited);
                } else if (node.podcastId) {
                  handleItemClick('podcast', node.podcastId);
                } else if (node.courseId) {
                  handleItemClick('course', node.courseId);
                }
              }}
              sx={{ 
                py: 0, 
                px: 1,
                ...(isCurrentItem && {
                  bgcolor: 'action.selected',
                  '&:hover': {
                    bgcolor: 'action.selected',
                  }
                })
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                {node.courseId ? (
                  <SkillEmojiAvatar skillId={node.course?.rootSkill} size={24} />
                ) : (
                  node.skillIdVisited ? (
                    <SkillEmojiAvatar skillId={node.skillIdVisited} size={24} />
                  ) : (
                    <Podcasts sx={{ fontSize: 24 }} />
                  )
                )}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography 
                    variant="body1" 
                    noWrap
                    sx={isCurrentItem ? { fontWeight: 'bold' } : {}}
                  >
                    {itemName}
                  </Typography>
                }
                secondary={
                  !isCurrentItem ? (
                    <Typography variant="caption" color="text.secondary">
                      {formatRelativeTime(node.createdDate)}
                    </Typography>
                  ) : (
                    <Typography variant="caption" color="primary">
                      Current
                    </Typography>
                  )
                }
              />
            </ListItemButton>
          </Tooltip>
        );
      }}
      emptyListComponent={
        <ListItemText primary="No history found" />
      }
    />
  );
}