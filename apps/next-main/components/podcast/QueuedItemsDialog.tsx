import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {useRsnUserId} from "@/clientOnly/hooks/useRsnUser";
import {useSupabase} from "@/components/supabase/SupabaseProvider";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {CSS} from "@dnd-kit/utilities";
import {
  Delete,
  DragIndicator,
  Info,
  QueueMusic,
} from "@mui/icons-material";
import {
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {Database} from "@reasonote/lib-sdk";

import {Txt} from "../typography/Txt";

interface QueuedItemsDialogProps {
  open: boolean;
  onClose: () => void;
}

type QueuedItem = Database['public']['Tables']['podcast_queue_item']['Row'] & {
  podcast?: Database['public']['Tables']['podcast']['Row'] | null;
};

const SortableItem = ({ item, handleDelete }: { item: QueuedItem, handleDelete: (itemId: string) => void }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <ListItem
      ref={setNodeRef}
      style={style}
      {...attributes}
    >
      <ListItemIcon {...listeners}>
        <DragIndicator />
      </ListItemIcon>
      <ListItemText primary={item.podcast?.title} />
      <IconButton onClick={() => handleDelete(item.id)}>
        <Delete />
      </IconButton>
    </ListItem>
  );
};

export const QueuedItemsDialog: React.FC<QueuedItemsDialogProps> = ({ open, onClose }) => {
  const [queuedItems, setQueuedItems] = useState<QueuedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { supabase } = useSupabase();
  const rsnUserId = useRsnUserId();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchQueuedItems = useCallback(async () => {
    if (!rsnUserId) return;

    setIsLoading(true);
    const { data, error } = await supabase
      .from('podcast_queue_item')
      .select('*, podcast(*)')
      .eq('for_user', rsnUserId)
      .order('position', { ascending: true });

    if (error) {
      console.error('Error fetching queued items:', error);
    } else {
      setQueuedItems(data || []);
    }
    setIsLoading(false);
  }, [rsnUserId, supabase]);

  useEffect(() => {
    if (open) {
      fetchQueuedItems();
    }
  }, [open, fetchQueuedItems]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setQueuedItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);

        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // Call the reorder_podcast_queue_item RPC function
        supabase.rpc('reorder_podcast_queue_item', {
          p_item_id: active.id as string,
          p_new_position: newIndex + 1,
        }).then(({ error }) => {
          if (error) {
            console.error('Error reordering item:', error);
            fetchQueuedItems(); // Refetch to ensure correct order
          }
        });

        return newItems;
      });
    }
  };

  const handleDelete = async (itemId: string) => {
    const { error } = await supabase
      .from('podcast_queue_item')
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error('Error deleting item:', error);
    } else {
      setQueuedItems(queuedItems.filter(item => item.id !== itemId));
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle><Txt startIcon={<QueueMusic/>} variant="h6" >Podcast Queue</Txt></DialogTitle>
      <DialogContent>
        {isLoading ? (
          <CircularProgress />
        ) : queuedItems.length === 0 ? (
          <Txt variant="caption" startIcon={<Info htmlColor="gray"/>} color="text.secondary">Your queue is empty!<br/>Add some podcasts to your queue to listen to them later.</Txt>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={queuedItems.map(item => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <List>
                {queuedItems.map((item) => (
                  <SortableItem key={item.id} item={item} handleDelete={handleDelete} />
                ))}
              </List>
            </SortableContext>
          </DndContext>
        )}
      </DialogContent>
    </Dialog>
  );
};
