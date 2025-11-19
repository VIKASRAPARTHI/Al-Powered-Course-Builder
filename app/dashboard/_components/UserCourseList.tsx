"use client";

import { CourseType } from "@/types/types";
import { useUser } from "@clerk/nextjs";
import { useContext, useEffect, useState } from "react";
import CourseCard from "./CourseCard";
import { UserCourseListContext } from "@/app/_context/UserCourseList.context";
import SkeletonLoading from "./SkeletonLoading";

const UserCourseList = () => {
  const { user } = useUser();
  const [courses, setCourses] = useState<CourseType[] | null>(null);
  const { setUserCourseList } = useContext(UserCourseListContext);

  useEffect(() => {
    user && getUserCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const getUserCourses = async () => {
    try {
      const email = user?.primaryEmailAddress?.emailAddress ?? "";
      const resp = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const json = await resp.json();
      const data = json?.data ?? [];
      setCourses(data as CourseType[]);
      setUserCourseList(data as CourseType[]);
    } catch (err) {
      console.error('Failed to fetch user courses', err);
      setCourses([]);
      setUserCourseList([]);
    }
    // console.log(res);
  };

  if (courses?.length === 0) return <div className="flex justify-center items-center mt-44">No courses found</div>;
  return (
    <div className="mt-10">
      <h2 className="font-medium text-lg">My AI Courses</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {courses ? (
          courses.map((course, index) => (
            <CourseCard
              key={index}
              course={course}
              onRefresh={() => getUserCourses()}
            />
          ))
        ) : (
          <SkeletonLoading items={5} />
        )}
      </div>
    </div>
  );
};

export default UserCourseList;
