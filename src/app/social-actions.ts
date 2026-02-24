'use server';

// Stub file — Social module was removed from the sidebar, but
// ClientTabs still renders a Social tab that depends on these functions.
// They return empty arrays so the UI still loads without errors.

export async function getSocialAccounts(_clientId: number) { return []; }
export async function getSocialPosts(_clientId: number) { return []; }
export async function createSocialPost(_formData: FormData) { }
export async function updateSocialPost(_id: number, _data: any) { }
export async function deleteSocialPost(_id: number) { }
