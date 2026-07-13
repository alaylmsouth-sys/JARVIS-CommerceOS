import type {ReactNode} from 'react';import './styles.css';
export const metadata={title:'JARVIS CommerceOS',description:'Stable Foundation'};
export default function RootLayout({children}:{children:ReactNode}){return <html lang="ko"><body>{children}</body></html>}
