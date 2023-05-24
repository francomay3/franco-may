interface WrappIfProps {
  condition: boolean;
  Wrapper: React.ElementType;
  wrapperProps?: Record<string, unknown>;
  wrapperStyles?: Record<string, unknown>;
  children: React.ReactNode;
  wrapperClassName?: string;
}

const WrappIf = ({
  condition,
  Wrapper,
  wrapperProps,
  wrapperStyles,
  wrapperClassName,
  children,
}: WrappIfProps) => {
  if (condition) {
    return (
      <Wrapper
        {...wrapperProps}
        className={wrapperClassName}
        style={wrapperStyles}
      >
        {children}
      </Wrapper>
    );
  }

  return <>{children}</>;
};

export default WrappIf;
