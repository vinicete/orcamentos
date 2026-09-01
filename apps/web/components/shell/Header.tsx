import { MonthTabs } from './MonthTabs';
import { NavLinks } from './NavLinks';
import { SignOutButton } from './SignOutButton';

export function Header() {
  return (
    <div className="sticky top-0 z-30 border-b-2 border-divider bg-bg">
      <div className="mx-auto flex max-w-[1320px] items-center gap-5 px-5 py-3">
        <div className="mr-auto font-heading text-[17px] tracking-[-.01em]">
          ORÇAMENTO<span className="text-accent">.</span>
        </div>
        <NavLinks />
        <SignOutButton />
      </div>
      <MonthTabs />
    </div>
  );
}
