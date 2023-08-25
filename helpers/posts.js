export function validateCreatePostInput(input) {
	const { username, title, content } = input;
	if (!username || !title || !content) {
		throw Error('username, title and content are required');
	}
	if (username.length > 12) {
		throw Error('username must be less than 12 characters');
	}
	return {
		username: username.toLowerCase(),
		title,
		content,
	};
}
