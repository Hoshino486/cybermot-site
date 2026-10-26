import type {Metadata} from 'next';
import DraftWorkspace from '../../components/DraftWorkspace';
export const metadata:Metadata={title:'创作',robots:{index:false,follow:true}};
export default function Page(){return <DraftWorkspace startWriting/>;}

