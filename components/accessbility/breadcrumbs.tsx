"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import React, { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const BreadCrumbs: React.FC<Pick<ComponentProps<"div">, "className">> = ({
  className,
}): React.ReactNode => {
  const pathname = usePathname();
  const breadcrumbs = pathname
    ?.split("/")
    .filter((x) => x)
    .map((segment, index, arr) => {
      const href = `/${arr.slice(0, index + 1).join("/")}`;
      return {
        name: segment.charAt(0).toUpperCase() + segment.slice(1),
        href,
      };
    });

  return (
    <div className={cn("p-1 text-sm  ", className)}>
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbs?.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            const isLink = crumb.href.toLowerCase() !== pathname;

            return (
              <React.Fragment key={crumb.href}>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild={isLink}>
                    {isLink ? (
                      <Link href={crumb.href} className="hover:text-primary">
                        {crumb.name.replaceAll("-", " ")}
                      </Link>
                    ) : (
                      <span>{crumb.name.replaceAll("-", " ")}</span>
                    )}
                  </BreadcrumbLink>
                </BreadcrumbItem>

                {!isLast && <BreadcrumbSeparator />}
              </React.Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
};

export default BreadCrumbs;
