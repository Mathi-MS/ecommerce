import { Link as RouterLink, LinkProps } from 'react-router-dom';
import { preloadRoute } from '@/utils/routePreloader';
import { forwardRef } from 'react';

interface PreloadLinkProps extends LinkProps {
  preload?: boolean;
  preloadDelay?: number;
}

export const PreloadLink = forwardRef<HTMLAnchorElement, PreloadLinkProps>(
  ({ preload = true, preloadDelay = 200, onMouseEnter, ...props }, ref) => {
    let preloadTimer: NodeJS.Timeout;

    const handleMouseEnter = (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (preload && typeof props.to === 'string') {
        preloadTimer = setTimeout(() => {
          preloadRoute(props.to as string);
        }, preloadDelay);
      }
      
      if (onMouseEnter) {
        onMouseEnter(event);
      }
    };

    const handleMouseLeave = () => {
      if (preloadTimer) {
        clearTimeout(preloadTimer);
      }
    };

    return (
      <RouterLink
        ref={ref}
        {...props}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />
    );
  }
);

PreloadLink.displayName = 'PreloadLink';

// Export regular Link for cases where preloading isn't needed
export { Link } from 'react-router-dom';