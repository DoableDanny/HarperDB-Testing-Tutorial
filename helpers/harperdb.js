export async function harperDbClient(body) {
	var myHeaders = new Headers();
	myHeaders.append('Content-Type', 'application/json');
	myHeaders.append('Authorization', process.env.HARPERDB_SECRET);

	var raw = JSON.stringify(body);

	var requestOptions = {
		method: 'POST',
		headers: myHeaders,
		body: raw,
		redirect: 'follow',
	};

	try {
		const response = await fetch('http://localhost:9925', requestOptions);
		const json = await response.json();
		return { response, json };
	} catch (error) {
		console.log(error);
	}
}
