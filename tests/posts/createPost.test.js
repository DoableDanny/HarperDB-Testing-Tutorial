import 'dotenv/config';

import { test } from 'tap';
import { validateCreatePostInput } from '../../helpers/posts.js';
import { HDB_URL, SCHEMA } from '../../config/constants.js';
import { harperDbClient } from '../../helpers/harperdb.js';

test('POST `/posts`', async (t) => {
	// Unit test -- sad path
	test('Test if error is thrown from validate post data function call', async (t) => {
		t.throws(
			() => {
				const input = {
					username: 'Danny Adams',
					title: 'This is the Title',
					// content: "This is the contents of the post. Blah blah etc.", // no content provided should throw error
				};
				validateCreatePostInput(input);
			},
			{
				message: 'username, title and content are required', // error message we expect
				// name: "ExpectedErrorName", // Optional: check error name if needed
			}
		);
	});

	// Unit test -- happy path
	test('Check post data is validated correctly', async (t) => {
		const input = {
			username: 'Danny Adams',
			title: 'This is the Title',
			content: 'This is the contents of the post. Blah blah etc.',
			naughtyKey: "This key shouldn't be here",
		};
		const validData = validateCreatePostInput(input);
		t.equal(validData.title, input.title);
		t.equal(validData.content, input.content);
		t.equal(validData.username, input.username.toLowerCase()); // username should be lowercased
		t.equal(validData.hasOwnProperty('naughtyKey'), false); // naughtyKey should not be returned from validateCreateProductInput()
	});

	// Feature test: sad path
	test('Trying to create a post with username that is too long', async (t) => {
		const username = 'This username is just way to long...';
		const title = 'This is the Title';
		const content = 'This is the contents of the post. Blah blah etc.';

		const { response, json } = await postThePost({ username, title, content });

		t.equal(response.status, 400);
		t.equal(json.message, 'username must be less than 12 characters');
	});

	// Feature test: sad path
	test('Trying to create a post with no title', async (t) => {
		const username = 'Test User';
		const title = '';
		const content = 'This is the contents of the post. Blah blah etc.';

		const { response, json } = await postThePost({ username, title, content });

		t.equal(response.status, 400);
		t.equal(json.message, 'username, title and content are required');
	});

	// Feature test: happy path
	test('Create a post successfully', async (t) => {
		// create some post data
		const username = 'Test User';
		const title = 'This is the Title';
		const content = 'This is the contents of the post. Blah blah etc.';

		// Hit our custom function api endpoint to create new post
		const { response, json } = await postThePost({ username, title, content });
		console.log('JSON R');
		console.log(json.inserted_hashes);
		const postIds = json.inserted_hashes;

		// Teardown => run callback once test is complete
		t.teardown(async () => {
			// Clean up: delete the test post from db
			const { deleteResponse } = await deletePosts(postIds);
			console.log('Deleted posts with status ', deleteResponse.status);
		});

		// Fetch this new post from the db
		const { response: dbResponse, json: dbJson } = await harperDbClient({
			operation: 'search_by_hash',
			schema: SCHEMA,
			table: 'posts',
			hash_values: postIds,
			get_attributes: ['id', 'username', 'title', 'content'],
		});
		const dbNewPost = dbJson[0];

		console.log('DB RESULT:');
		console.log(dbResponse, dbJson, dbNewPost);

		// Check status and response is correct from api
		t.equal(response.status, 200);
		t.equal(json.message, 'inserted 1 of 1 records');

		// Check the post was inserted correctly into the db
		t.equal(dbResponse.status, 200);
		t.equal(dbNewPost.username, username.toLowerCase()); // username should be lowercased
		t.equal(dbNewPost.title, title);
		t.equal(dbNewPost.content, content);
	});
});

async function postThePost(input) {
	const response = await fetch(HDB_URL + '/posts', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(input),
	});
	const json = await response.json();
	return { response, json };
}

async function deletePosts(postIdsArray) {
	const { response: deleteResponse, json: deleteJson } = await harperDbClient({
		operation: 'delete',
		schema: 'testing_project',
		table: 'posts',
		hash_values: postIdsArray,
	});
	console.log('Delete response:');
	console.log(deleteResponse, deleteJson);
	return { deleteResponse, deleteJson };
}
