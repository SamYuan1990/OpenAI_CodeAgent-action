# For End user or Developer

## Auto Documentation Generation(tbd)

## Software Test Generation(tbd)

## Software Evaluation(TBD)

## Containerize to allow you deploy whereever you want.

Some times people may not to run this in public, for example private Github
deployment or private Gen AI API endpoint. So provide a container version for
you to integrate with your own CI system.

# To use with Tasks.json
## Input adaopters

## Output adaopters

## Define a pipeline like process flow.

- From the give file.
- Get the content with send to GenAI.
- Send content with prompt to GenAI.
- Receive the content from GenAI response.
- Take action as put the content into new files. All steps above been defined as
  a single task: You can take [Tasks.json](./Tasks.json) as example.

# For Developer/contributor for this REPO.

The processTask will create a queue for tasks going to process to GenAI, so there going to have another queue as GenAI task queue.
