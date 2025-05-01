import { useEffect, useState } from "react";

import { Edit2, Plus, Save, Target, Trash2, X } from "lucide-react";

import { useRsnUser } from "@/clientOnly/hooks/useRsnUser";
import { useSupabase } from "@/components/supabase/SupabaseProvider";
import { Txt } from "@/components/typography/Txt";
import { Card, IconButton, Stack, TextField } from "@mui/material";

type GoalsSectionProps = {
    skillId: string | null | undefined;
}

export function GoalsSection({ skillId }: GoalsSectionProps) {
    const { rsnUser } = useRsnUser();
    const { sb } = useSupabase();
    const [goals, setGoals] = useState<string[]>([]);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editingText, setEditingText] = useState("");
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [newGoalText, setNewGoalText] = useState("");

    useEffect(() => {
        if (!rsnUser?.data?.id || !skillId) return;
        fetchGoals();
    }, [JSON.stringify(rsnUser), skillId]);

    const fetchGoals = async () => {
        const { data } = await sb
            .from('user_skill')
            .select('interest_reasons')
            .eq('rsn_user', rsnUser?.data?.id ?? '')
            .eq('skill', skillId ?? '')
            .single();

        setGoals(data?.interest_reasons ?? []);
    };

    const updateGoals = async (newGoals: string[]) => {
        if (!rsnUser?.data?.id || !skillId) return;
        try {
            await sb
                .from('user_skill')
                .upsert({
                    rsn_user: rsnUser.data.id,
                    skill: skillId,
                    interest_reasons: newGoals,
                    updated_date: new Date().toISOString(),
                    updated_by: rsnUser.data.id,
                },
                    {
                        onConflict: 'rsn_user, skill',
                    }
                );
        } catch (error) {
            console.error('Error updating goals:', error);
        }
        await fetchGoals();
    };

    const handleSaveEdit = async (index: number) => {
        if (editingText.trim()) {
            const newGoals = [...goals];
            newGoals[index] = editingText.trim();
            await updateGoals(newGoals);
        }
        setEditingIndex(null);
        setEditingText("");
    };

    const handleDelete = async (index: number) => {
        const newGoals = goals.filter((_, i) => i !== index);
        await updateGoals(newGoals);
    };

    const handleAddNew = async () => {
        if (newGoalText.trim()) {
            await updateGoals([...goals, newGoalText.trim()]);
            setNewGoalText("");
            setIsAddingNew(false);
        }
    };

    const handleKeyPress = async (
        e: React.KeyboardEvent,
        type: 'edit' | 'new',
        index?: number
    ) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (type === 'edit' && index !== undefined) {
                await handleSaveEdit(index);
            } else if (type === 'new') {
                await handleAddNew();
            }
        } else if (e.key === 'Escape') {
            if (type === 'edit') {
                setEditingIndex(null);
                setEditingText("");
            } else {
                setIsAddingNew(false);
                setNewGoalText("");
            }
        }
    };

    return (
        <Card sx={{ p: 2, borderRadius: 5 }} elevation={4}>
            <Stack spacing={2}>
                <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                >
                    <Txt startIcon={<Target />} variant="h6">
                        Your Learning Goals
                    </Txt>
                    {!isAddingNew && (
                        <IconButton
                            onClick={() => setIsAddingNew(true)}
                            size="small"
                        >
                            <Plus size={20} />
                        </IconButton>
                    )}
                </Stack>

                <Stack spacing={2}>
                    {goals.map((goal, index) => (
                        <Card
                            key={index}
                            sx={{
                                p: 1.5,
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 5
                            }}
                            elevation={4}
                        >
                            {editingIndex === index ? (
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <TextField
                                        fullWidth
                                        value={editingText}
                                        onChange={(e) => setEditingText(e.target.value)}
                                        onKeyDown={(e) => handleKeyPress(e, 'edit', index)}
                                        size="small"
                                        autoFocus
                                    />
                                    <IconButton
                                        onClick={() => handleSaveEdit(index)}
                                        color="primary"
                                        size="small"
                                    >
                                        <Save size={18} />
                                    </IconButton>
                                    <IconButton
                                        onClick={() => setEditingIndex(null)}
                                        color="error"
                                        size="small"
                                    >
                                        <X size={18} />
                                    </IconButton>
                                </Stack>
                            ) : (
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Txt>{goal}</Txt>
                                    <Stack direction="row" spacing={1}>
                                        <IconButton
                                            onClick={() => {
                                                setEditingIndex(index);
                                                setEditingText(goal);
                                            }}
                                            size="small"
                                        >
                                            <Edit2 size={16} />
                                        </IconButton>
                                        <IconButton
                                            onClick={() => handleDelete(index)}
                                            color="error"
                                            size="small"
                                        >
                                            <Trash2 size={16} />
                                        </IconButton>
                                    </Stack>
                                </Stack>
                            )}
                        </Card>
                    ))}

                    {isAddingNew && (
                        <Card
                            sx={{
                                p: 1.5,
                                bgcolor: 'background.paper',
                                border: '1px solid',
                                borderColor: 'primary.main',
                            }}
                        >
                            <Stack direction="row" spacing={1} alignItems="center">
                                <TextField
                                    fullWidth
                                    value={newGoalText}
                                    onChange={(e) => setNewGoalText(e.target.value)}
                                    onKeyDown={(e) => handleKeyPress(e, 'new')}
                                    placeholder="Enter your new goal"
                                    size="small"
                                    autoFocus
                                />
                                <IconButton
                                    onClick={handleAddNew}
                                    color="primary"
                                    size="small"
                                >
                                    <Save size={18} />
                                </IconButton>
                                <IconButton
                                    onClick={() => {
                                        setIsAddingNew(false);
                                        setNewGoalText("");
                                    }}
                                    color="error"
                                    size="small"
                                >
                                    <X size={18} />
                                </IconButton>
                            </Stack>
                        </Card>
                    )}
                </Stack>

                {goals.length === 0 && !isAddingNew && (
                    <Txt
                        color="text.secondary"
                        align="center"
                        sx={{ fontStyle: 'italic' }}
                    >
                        No goals set yet. <br />Click the + button to add one!
                    </Txt>
                )}
            </Stack>
        </Card>
    );
} 