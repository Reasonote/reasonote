// /components/NextBreadcrumb.tsx
'use client'

import React from "react";

import _ from "lodash";
import {usePathname} from "next/navigation";

import {ArrowRight} from "@mui/icons-material";
import {
  Breadcrumbs,
  Link,
} from "@mui/material";

type TBreadCrumbProps = {
    containerClasses?: string,
    capitalizeLinks?: boolean
    showCurrentPage?: boolean
    currentPageBreadcrumb?: {
        name: string | React.ReactNode,
    }
}

const NextBreadcrumb = ({showCurrentPage, currentPageBreadcrumb}: TBreadCrumbProps) => {
    const paths: any = usePathname()
    const pathNames = paths.split('/').filter( path => path );

    const usingPathNames = showCurrentPage ? pathNames : pathNames.slice(0, pathNames.length - 1)

    return (
        <div>
            <Breadcrumbs aria-label="breadcrumb" separator={<ArrowRight fontSize="small" sx={{width: '15px'}}/>}>
                {
                    usingPathNames.map( (link, index) => {
                        let href = `/${usingPathNames.slice(0, index + 1).join('/')}`
                        let itemLink = _.capitalize(link[0]) + link.slice(1, link.length)
                        
                        // Special case for current breadcrumb.
                        if (index === usingPathNames.length - 1 && showCurrentPage && currentPageBreadcrumb) {
                            return (
                                <Link href={href}>{
                                    currentPageBreadcrumb.name
                                }</Link>
                            )
                        }

                        return (
                            <Link href={href}>{itemLink}</Link>
                        )
                    })
                }
            </Breadcrumbs>
        </div>
    )
}

export default NextBreadcrumb