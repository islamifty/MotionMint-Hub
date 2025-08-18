
'use server';

import { revalidatePath } from 'next/cache';
import { allUsers } from '@/lib/data';
import type { User } from '@/types';

export async function addNewUser(userData: {id: string, name: string, email: string}) {
    const newUser: User = {
        ...userData,
        role: "user",
        initials: (userData.name || userData.email).substring(0,2).toUpperCase(),
    };
    allUsers.unshift(newUser);
    revalidatePath('/admin/users');
}
