'use client'
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SimpleHeader } from "@/components/headers/SimpleHeader";
import CenterPaperStack from "@/components/positioning/FullCenterPaperStack";
import { Txt } from "@/components/typography/Txt";
import { Button, Card, Stack, List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, CircularProgress, Tooltip, CardMedia } from "@mui/material";
import { Edit, Lock } from "@mui/icons-material";
import { formatDistanceToNow } from "date-fns";
import { GetCourseRoute } from "@/app/api/courses/get/routeSchema";

export default function CoursesListPage() {
    const router = useRouter();
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const result = await GetCourseRoute.call({});
                const sortedCourses = (result.data?.courses ?? []).sort((a, b) => {
                    return new Date(b.updatedDate).getTime() - new Date(a.updatedDate).getTime();
                });
                setCourses(sortedCourses);
            } catch (error) {
                console.error('Error fetching courses:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, []);

    if (loading) {
        return (
            <CenterPaperStack stackProps={{ gap: 2 }}>
                <Stack alignItems="center" justifyContent="center" height="200px">
                    <CircularProgress />
                </Stack>
            </CenterPaperStack>
        );
    }

    return (
        <CenterPaperStack
            stackProps={{
                gap: 2,
                sx: {
                    height: '100%',
                    overflow: 'auto',
                    pb: 4  // Add padding at bottom
                }
            }}
        >
            <SimpleHeader
                leftContent={
                    <Stack>
                        <Txt variant={'h4'}>
                            My Courses
                        </Txt>
                    </Stack>
                }
                rightContent={
                    <Button
                        variant="contained"
                        onClick={() => router.push('/app/courses/new')}
                    >
                        Create New Course
                    </Button>
                }
            />

            <Card>
                <List sx={{ maxHeight: '70vh', overflow: 'auto' }}>
                    {courses.length === 0 ? (
                        <ListItem>
                            <ListItemText primary="No courses yet. Create your first course!" />
                        </ListItem>
                    ) : (
                        courses.map((course, index) => (
                            <ListItem
                                key={course.id}
                                divider={index < courses.length - 1}
                                sx={{
                                    py: 2,
                                    cursor: 'pointer',
                                    '&:hover': {
                                        bgcolor: 'action.hover'
                                    }
                                }}
                                onClick={() => router.push(`/app/courses/${course.id}/view`)}
                            >
                                <CardMedia
                                    component="img"
                                    sx={{
                                        width: 120,
                                        height: 68,
                                        borderRadius: 1,
                                        mr: 2,
                                    }}
                                    image={course?.coverImagePage?.url || '/static/images/Reasonote-Icon-1.png'}
                                    alt={course?.coverImagePage?.url ? "Course cover" : "Reasonote logo"}
                                />
                                <ListItemText
                                    primary={
                                        <Txt variant="h6">
                                            {course.name}
                                        </Txt>
                                    }
                                    secondary={
                                        <Stack spacing={1}>
                                            <Txt variant="body2">
                                                {course.description}
                                            </Txt>
                                            <Txt variant="caption" color="text.secondary">
                                                Updated {formatDistanceToNow(new Date(course.updatedDate), { addSuffix: true })}
                                            </Txt>
                                        </Stack>
                                    }
                                />
                                <ListItemSecondaryAction
                                    sx={{ right: 16 }} // Add some padding from the right edge
                                >
                                    {course.canEdit ? (
                                        <Tooltip title="Edit">
                                            <IconButton
                                                edge="end"
                                                onClick={(e) => {
                                                    e.stopPropagation(); // Prevent the ListItem click when clicking the edit button
                                                    router.push(`/app/courses/${course.id}/edit`);
                                                }}
                                            >
                                                <Edit />
                                            </IconButton>
                                        </Tooltip>
                                    ) : (
                                        <Tooltip title="View Only">
                                            <IconButton
                                                edge="end"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    // TODO: Request edit access
                                                }}
                                            >
                                                <Lock />
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                </ListItemSecondaryAction>
                            </ListItem>
                        ))
                    )}
                </List>
            </Card>
        </CenterPaperStack>
    );
}