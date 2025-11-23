import { icon } from "@/assets/icons";

export default function Icon({
  name,
  className = "",
  ...props
}: {
  name?: string;
  className?: string;
} & React.SVGProps<SVGSVGElement>) {
  if (!name) return null;

  const IconComponent = icon[name.toLowerCase() as keyof typeof icon];

  if (!IconComponent) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`Icon "${name}" not found in icon registry.`);
    }
    return null;
  }

  return <IconComponent className={className} {...props} />;
}
