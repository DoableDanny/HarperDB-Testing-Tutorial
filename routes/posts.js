import { validateCreatePostInput } from '../helpers/posts.js';
import { SCHEMA } from '../config/constants.js';

const POSTS_TABLE = 'posts';

export default async (server, { hdbCore, logger }) => {
	// GET: get list of posts
	server.route({
		url: '/posts',
		method: 'GET',
		handler: (request, reply) => {
			request.body = {
				operation: 'sql',
				sql: `SELECT * FROM ${SCHEMA}.${POSTS_TABLE}`,
			};
			return hdbCore.requestWithoutAuthentication(request);
		},
	});

	// POST: create a new post
	server.route({
		url: '/posts',
		method: 'POST',
		handler: (request, reply) => {
			const data = request.body;
			let validatedData;
			try {
				// validate the posted data using our custom validateCreateProductInput function.
				validatedData = validateCreatePostInput(data);
			} catch (error) {
				// posted data is invalid, so return the error message
				return reply.status(403).send({ message: error.message });
			}
			// data is all good, so insert it into the posts table
			request.body = {
				operation: 'insert',
				schema: SCHEMA,
				table: POSTS_TABLE,
				records: [
					{
						...validatedData,
					},
				],
			};

			return hdbCore.requestWithoutAuthentication(request);
		},
	});
};
