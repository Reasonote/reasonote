'use client'

import {
  ReactNode,
  useEffect,
  useState,
} from "react";

import {GetCourseRoute} from "@/app/api/courses/get/routeSchema";
import {useRouteParamsSingle} from "@/clientOnly/hooks/useRouteParams";
import {EntityLayout} from "@/components/layouts/EntityLayout";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import HomeIcon from "@mui/icons-material/Home";
import LocalLibraryIcon from "@mui/icons-material/LocalLibrary";
import PodcastsIcon from "@mui/icons-material/Podcasts";
import SchoolIcon from "@mui/icons-material/School";

// List of route patterns where the sidebar should not appear
const noSidebarRoutes: RegExp[] = [
    // Add regex patterns here if needed
];

const noBottomBarRoutes: RegExp[] = [
    /^practice\/[^\/]+$/,
];

const noHeaderRoutes: RegExp[] = [
    /^practice\/[^\/]+$/,
];

const menuItems = [
    { name: 'Home', path: '', icon: HomeIcon, pathRegexes: [/^$/] },
    { name: 'Classroom', path: 'classroom', icon: SchoolIcon, pathRegexes: [/^classroom$/] },
    { name: 'Practice', path: 'practice', icon: FitnessCenterIcon, pathRegexes: [/^practice.*/] },
    { name: 'Podcast', path: 'podcast/new', icon: PodcastsIcon, pathRegexes: [/^podcast.*/] },
];

const moreMenuItems = [
    { name: 'Skill Tree', path: 'tree', icon: AccountTreeIcon, pathRegexes: [/^tree$/] },
    { name: 'Lessons', path: 'lessons', icon: LocalLibraryIcon, pathRegexes: [/^lessons.*/] },
];

export default function CourseLayout({ children }: { children: ReactNode }) {
    const { courseId } = useRouteParamsSingle(['courseId']);
    const [course, setCourse] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const result = await GetCourseRoute.call({ courseId: courseId ?? '' });
                setCourse(result.data?.courses[0] ?? null);
            } catch (error) {
                console.error('Error fetching courses:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchCourse();
    }, []);

    return (
        <EntityLayout
            entityId={courseId ?? ''}
            entityType="course"
            menuItems={menuItems}
            moreMenuItems={moreMenuItems}
            noSidebarRoutes={noSidebarRoutes}
            noBottomBarRoutes={noBottomBarRoutes}
            noHeaderRoutes={noHeaderRoutes}
            notFound={!courseId || (!loading && !course)}
            entityData={course}
            rootSkillId={course?.rootSkillId}
        >
            {children}
        </EntityLayout>
    );
} 