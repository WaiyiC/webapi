export const dog = {
  "$schema": "http://json-schema.org/draft-04/schema#",
  "id": "/dog",
  "title": "Dog",
  "description": "A dog in the system",
  "type": "object",
  "properties": {
    "name": {
      "description": "Name of the dog",
      "type": "string"
    },
    "breed": {
      "description": "Breed of the dog",
      "type": "string"
    },
    "age": {
      "description": "Age of the dog in years",
      "type": "integer",
      "minimum": 0
    },
    "description": {
      "description": "Description of the dog",
      "type": "string"
    },
    "imageurl": {
      "description": "URL of the dog's image",
      "type": "string",
      "format": "uri"
    }
  },
  "required": ["name", "breed", "age", "description"]
}
