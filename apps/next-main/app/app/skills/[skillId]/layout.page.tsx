'use client'

import {
  ReactNode,
  useEffect,
} from "react";

import {SkillVisitRoute} from "@/app/api/skill-visit/routeSchema";
import {useRouteParamsSingle} from "@/clientOnly/hooks/useRouteParams";
import {BreadcrumbEntry} from "@/components/breadcrumbs/BreadcrumbEntry";
import {EntityLayout} from "@/components/layouts/EntityLayout";
import ChatIcon from "@mui/icons-material/Chat";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import HomeIcon from "@mui/icons-material/Home";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import LocalLibraryIcon from "@mui/icons-material/LocalLibrary";
import PodcastsIcon from "@mui/icons-material/Podcasts";
import SettingsIcon from "@mui/icons-material/Settings";
import {useSkillFlatFragLoader} from "@reasonote/lib-sdk-apollo-client-react";

// List of route patterns where the sidebar should not appear
const noSidebarRoutes: RegExp[] = [
    // Add regex patterns here, e.g.:
    // /^\/app\/skills\/[^\/]+\/fullscreen-view$/,
];

const noBottomBarRoutes: RegExp[] = [
    // Add regex patterns here, e.g.:
    /^\/app\/skills\/[^\/]+\/practice\/[^\/]+$/,
    /^\/app\/skills\/[^\/]+\/practice_v2\/[^\/]+$/,
];

const noHeaderRoutes: RegExp[] = [
    /^\/app\/skills\/[^\/]+\/practice\/[^\/]+$/,
    /^\/app\/skills\/[^\/]+\/practice_v2\/[^\/]+$/,
];

export default function SkillIdLayout({ children }: { children: ReactNode }) {
    const { skillId } = useRouteParamsSingle(['skillId']);
    const skillRes = useSkillFlatFragLoader(skillId);

    // Define menu items with standard tab parameters
    const menuItems = [
        { 
            name: 'Resources', 
            path: '?tab=resources', 
            icon: LibraryBooksIcon,
            pathRegexes: [/\?tab=resources/, /&tab=resources/]
        },
        { name: 'Home', path: '', icon: HomeIcon, pathRegexes: [/^$/, /^\?tab=all$/, /&tab=all/] },
        { name: 'Practice', path: '?tab=practice', icon: FitnessCenterIcon, pathRegexes: [/^practice.*/, /\?tab=practice/, /&tab=practice/] },
        { 
            name: 'Chat', 
            path: '?tab=chat', 
            icon: ChatIcon,
            pathRegexes: [/\?tab=chat/, /&tab=chat/]
        },
    ];

    const moreMenuItems = [
        // { name: 'Skill Tree', path: 'tree', icon: AccountTreeIcon, pathRegexes: [/^tree$/] },
        { name: 'Lessons', path: '?tab=lessons', icon: LocalLibraryIcon, pathRegexes: [/^lessons.*/, /\?tab=lessons/, /&tab=lessons/] },
        { name: 'Settings', path: '?tab=settings', icon: SettingsIcon, pathRegexes: [/^settings$/, /\?tab=settings/, /&tab=settings/] },
        { name: 'Podcast', path: '?tab=podcast', icon: PodcastsIcon, pathRegexes: [/^podcast.*/, /\?tab=podcast/, /&tab=podcast/] },
        // { name: 'Classroom', path: 'classroom', icon: SchoolIcon, pathRegexes: [/^classroom$/] },
    ];

    useEffect(() => {
        if (skillId) {
            SkillVisitRoute.call({ skillId }).catch(console.error);
        }
    }, [skillId]);

    // Instead of using the useHeaderBreadcrumbs hook, we'll use BreadcrumbEntry component
    return (
        <BreadcrumbEntry entityId={skillId || undefined}>
            <EntityLayout
                entityId={skillId ?? ''}
                entityType="skill"
                menuItems={menuItems}
                moreMenuItems={moreMenuItems}
                noSidebarRoutes={noSidebarRoutes}
                noBottomBarRoutes={noBottomBarRoutes}
                noHeaderRoutes={noHeaderRoutes}
                notFound={!skillId || (!skillRes.loading && (!skillRes.data || Object.keys(skillRes.data).length === 0))}
                entityData={skillRes.data}
            >
                {children}
            </EntityLayout>
        </BreadcrumbEntry>
    );
}