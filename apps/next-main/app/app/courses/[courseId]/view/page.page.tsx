'use client'
import CourseHomeTab from "./home";

export default function CourseViewPage({ params }: { params: { courseId: string } }) {

    return <CourseHomeTab courseId={params.courseId} />
}
