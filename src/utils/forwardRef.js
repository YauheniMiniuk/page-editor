import { forwardRef } from 'react';

export const wrapWithForwardRef = (Component) =>
  forwardRef((props, ref) => <Component {...props} ref={ref} />);
