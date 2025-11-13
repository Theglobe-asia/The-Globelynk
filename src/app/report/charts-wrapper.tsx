"use client";

import dynamic from "next/dynamic";

const Charts = dynamic(() => import("./charts"), { ssr: false });

export default function ChartsWrapper(props: any) {
  return <Charts {...props} />;
}
