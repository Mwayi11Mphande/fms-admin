import Image from "next/image";

const Logo = () => {
  return (
    <Image
        src="/logo.png"
        alt="site_logo"
        width={64}
        height={64}
        className="h-10 w-10 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8 object-contain"
    />
  );
};

export {Logo}