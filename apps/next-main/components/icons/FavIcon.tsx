interface ReasonoteBetaIconProps {
    size?: number;
}

export function ReasonoteBetaIcon({ size = 48 }: ReasonoteBetaIconProps) {
    // Use size 42 as reference point for scaling
    const scale = size / 48;
    
    // Scale badge properties
    const fontSize = Math.max(6 * scale, 4); // Min font size of 4px
    const padding = `0px ${3 * scale}px`;
    const borderRadius = 4 * scale;
    const bottom = -2 * scale;
    const right = -8 * scale;

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <img 
                src={'/favicon.ico'} 
                width={size} 
                height={size} 
                alt={"reasonote-icon"} 
                style={{borderRadius: '3px'}}
            />
            <div 
                style={{
                    position: 'absolute',
                    bottom,
                    right,
                    backgroundColor: '#2196f3',
                    color: 'white',
                    fontSize: `${fontSize}px`,
                    padding,
                    borderRadius: `${borderRadius}px`,
                    fontWeight: 600,
                    lineHeight: 1,
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: `${fontSize * 1.6}px`, // Ensure consistent height
                }}
            >
                beta
            </div>
        </div>
    );
}