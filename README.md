## Contributing as a Researcher

TODO

## Contributing as a Developer

Create a separate GitHub account for working on this project - do not use your real name.

After forking the project, be sure to change the git config in your local fork so that it does not use your real world name and email address.

Add something like the following to `.git/config`:

```
[user]
	name = Sedition Tracker
	email = sedition [at] example.com
```

Replace the name with your fake GH user name (you can leave the email as above if you want).

## Running Jekyll Locally with Docker

```
yarn install
yarn docker:build
yarn jekyll
```

## Importing Data

### Import new suspects

```
yarn suspect import
```

### Import new charges

Download the latest charges using [this Google Sheet](https://docs.google.com/spreadsheets/d/18NzncPJ-5oaYrDfq_VnjaSTLyY_vKaoSTgc6lznl9GU/edit?pli=1#gid=0). Use the "Arrested" tab and download as Microsoft Excel

```
y charges import -f ~/Downloads/"Capitol Suspects Database.xlsx"
```
