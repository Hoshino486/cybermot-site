import type {Metadata} from 'next';
import SettingsExperience from '../../components/SettingsExperience';
export const metadata:Metadata={title:'设置',robots:{index:false,follow:true}};
export default function Page(){return <SettingsExperience/>;}

