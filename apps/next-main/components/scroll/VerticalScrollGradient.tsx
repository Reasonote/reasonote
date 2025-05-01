// VerticalScrollGradients.tsx
import React from "react";

interface GradientProps {
  color: string;
  height: number;
}

interface VerticalScrollGradientsProps {
  children: React.ReactNode;
  topGradient?: GradientProps;
  bottomGradient?: GradientProps;
}

const VerticalScrollGradients: React.FC<VerticalScrollGradientsProps> = ({
  children,
  topGradient = { color: "#ffffff", height: 50 },
  bottomGradient = { color: "#ffffff", height: 50 },
}) => {
  // const [isScrollable, setIsScrollable] = useState(false);
  // const [scrollPosition, setScrollPosition] = useState(0);
  // const scrollableDivRef = useRef<HTMLDivElement | null>(null);

  // const checkScrollable = () => {
  //     if (!scrollableDivRef.current) return;
  //     setIsScrollable(scrollableDivRef.current.scrollHeight > scrollableDivRef.current.clientHeight);
  // };

  // const onScroll = () => {
  //     if (!scrollableDivRef.current) return;
  //     setScrollPosition(scrollableDivRef.current.scrollTop);
  // };

  // useEffect(() => {
  //     checkScrollable();
  //     window.addEventListener('resize', checkScrollable);
  //     return () => {
  //         window.removeEventListener('resize', checkScrollable);
  //     };
  // }, []);

  // return (
  //     <div style={{
  //         position: 'relative',
  //         overflow: 'hidden',
  //     }}>
  //         <div ref={scrollableDivRef} style={{ overflowY: 'scroll', height: '100%' }} onScroll={onScroll}>
  //             {children}
  //         </div>
  //         {
  //             isScrollable && (
  //                 <>
  //                     <div
  //                         className="scrollable-gradient top"
  //                         style={{
  //                             top: 0,
  //                             backgroundImage: `linear-gradient(to top, transparent, ${topGradient.color})`,
  //                             height: `${topGradient.height}px`,
  //                             opacity: scrollPosition === 0 ? 0 : scrollPosition / topGradient.height,
  //                             position: 'absolute',
  //                             width: '100%',
  //                             pointerEvents: 'none',
  //                             transition: 'opacity 0.3s',
  //                         }}
  //                     />
  //                     <div
  //                         className="scrollable-gradient bottom"
  //                         style={{
  //                             bottom: 0,
  //                             backgroundImage: `linear-gradient(to bottom, transparent, ${bottomGradient.color})`,
  //                             height: `${bottomGradient.height}px`,
  //                             opacity:
  //                                 scrollPosition >= scrollableDivRef.current?.scrollHeight - scrollableDivRef.current?.clientHeight - bottomGradient.height
  //                                     ? 0
  //                                     : 1,
  //                             position: 'absolute',
  //                             width: '100%',
  //                             pointerEvents: 'none',
  //                             transition: 'opacity 0.3s',
  //                         }}
  //                     />
  //                 </>
  //             )
  //         }
  //     </div >
  // );
  return null;
};

export default VerticalScrollGradients;
