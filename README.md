# Hello, World! OpenAI Code Agent

[![Lint Codebase](https://github.com/SamYuan1990/OpenAI_CodeAgent/actions/workflows/linter.yml/badge.svg)](https://github.com/SamYuan1990/OpenAI_CodeAgent/actions/workflows/linter.yml)
[![Continuous Integration](https://github.com/SamYuan1990/OpenAI_CodeAgent/actions/workflows/ci.yml/badge.svg)](https://github.com/SamYuan1990/OpenAI_CodeAgent/actions/workflows/ci.yml)

Note: currently just support for golang and nodejs.

This Github action is attempt to provide us a container based GHA agent, which:

- AI agent coding for you offline in async.

> Most of today's AI agent as copilot and work with you in sync with your IDE.

What if I just complete the basic unit test and basic code to meet the unit
test. Then, when I push it to remote, a pipeline with AI agent help to:

1. make the code more robust by adding more unit test.
1. improve the code's performance by adding benchmark test.
1. adding customer test as fuzz test for security.

Free your mind and energy from performance tunning as pointer escape, security
as injection attack as SQL injection as log4j?

Just meet the requirements from business, and step further for prototype
testing. Then leave foundmental level benchmark testing and fuzz testing to
GenAI. Then once GenAI makes it, you will review and works on GenAI's edition.
Just like you make your prototype 1st and leave dependbot to help you with
dependency bump up.

- Resource limits and controls to save token.

As the content size or token size limitation, we can't just leave GenAI with a
specific code branch today.

- Containerize to allow you deploy whereever you want.

Some times people may not to run this in public, for example private Github
deployment or private Gen AI API endpoint. So provide a container version for
you to integrate with your own CI system.

## Usage

Here's an example of how to use this action in a workflow file:

```yaml

```

## Inputs

| Input                    | Default | Description                                                     |
| ------------------------ | ------- | --------------------------------------------------------------- |
| `code_path`              | `n/A`   | The Path for the root of your code                              |
| `OpenAI_API_ENDPOINT`    | `n/A`   | The openAI API endpoint or your Gen AI service                  |
| `OpenAI_API_AccessToken` | `n/A`   | The Access token for openAI API endpoint or your Gen AI service |
| `propmt`                 | `n/A`   | The Prompt you are going to use with the job                    |
| `file_num`               | `n/A`   | The file number of the job to handle                            |

> Maybe in the future, we may open more options, currently the code is just for
> golang with some hard code settings.

## Outputs

n/A, so far it will receive the file from Gen AI and overwrite the file.

## Test Locally
