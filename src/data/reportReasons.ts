import type { ReportReason } from '../types/confession';

export const reportReasons: {id: ReportReason;label: string;description: string;}[] = [
{
  id: 'names-person',
  label: 'Names or exposes someone',
  description: 'Mentions a real name, section, or details that identify a person'
},
{ id: 'harassment', label: 'Bullying or harassment', description: 'Targets, insults, or threatens someone' },
{ id: 'hate', label: 'Hate speech', description: 'Attacks people for who they are' },
{ id: 'explicit', label: 'Sexual or explicit content', description: 'Not appropriate for a campus community' },
{ id: 'spam', label: 'Spam or selling', description: 'Ads, scams, or repeated posts' },
{ id: 'other', label: 'Something else', description: 'Tell the admins what’s wrong' }];