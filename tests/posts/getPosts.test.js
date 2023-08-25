import 'dotenv/config';

import { test } from 'tap';
import { HDB_URL } from '../../config/constants.js';
import { harperDbClient } from '../../helpers/harperdb.js';

test('GET /posts', async (t) => {
	test('Get all posts successfully', async (t) => {
		// create some posts
		const numberOfPosts = 3;
		const postIds = [];
		const username = 'Danny';
		const title = 'Title ' + Math.random();
		const content = 'This is the contents of the post.';

		for (let i = 0; i < numberOfPosts; i++) {
			// create the post in db
			const { response: createPostResponse, json: createPostJson } = await postThePost({
				username,
				title,
				content,
			});

			console.log('Post data:');
			console.log(username, title, content);

			// collect the hashes of the new posts so we can delete them once this test is complete
			postIds.push(...createPostJson.inserted_hashes);
		}
		console.log('Test post ids:');
		console.log(postIds);

		// Teardown => run callback once test is complete
		t.teardown(async () => {
			// Clean up: delete the test post from db
			const { deleteResponse } = await deletePosts(postIds);
			console.log('Deleted posts with status ', deleteResponse.status);
		});

		// fetch all posts by making a GET request to our /posts api endpoint
		const fetchPostsResponse = await fetch(HDB_URL + '/posts');
		const fetchPostsJSON = await fetchPostsResponse.json();

		// let's check that one of the posts has the correct data
		const checkPost = fetchPostsJSON.find((post) => post.id === postIds[0]);

		console.log('Post we are checking:');
		console.log(checkPost);

		// check we have success status code
		t.equal(fetchPostsResponse.status, 200);
		// check the data inserted into the db is what we expect
		t.equal(checkPost.title, title);
		t.equal(checkPost.username, username.toLocaleLowerCase());
		t.equal(checkPost.content, content);
	});
});

// Example post data:
// {
//     __updatedtime__: 1690497722646,
//     content: 'This is the contents of the post.',
//     id: 'f275429a-e711-40fa-a883-05f4fae68a18',
//     __createdtime__: 1690497722646,
//     username: 'danny',
//     title: 'Title'
//   }

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
