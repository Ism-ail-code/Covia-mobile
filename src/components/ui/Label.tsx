import { AppText } from "./AppText";

/** Field label, mirrors the web Label (text-sm font-medium). */
export function Label({ children, ...rest }: React.ComponentProps<typeof AppText>) {
  return (
    <AppText size="sm" weight={500} {...rest}>
      {children}
    </AppText>
  );
}
