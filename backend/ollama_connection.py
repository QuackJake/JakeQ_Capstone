from ollama import chat
import json, os

class Llama:
    def __init__(self, target_dir: str, model_name: str):
        if not os.path.isdir(target_dir):
            raise ValueError(f"Target directory does not exist: {target_dir}")
        self.target_dir = target_dir
        self.model_name = model_name

    def test(self, document):
        # System prompt for document analysis and filling
        system_prompt = """
        You are an expert in legal document analysis and filling. You will be given a document with checkboxes, placeholders, or sections that require information to be filled in. 
        Your task is to analyze a document and create placeholder variables for different fillable field types. 
        The placeholder naming schema will be as follows:
        - $FieldType_FieldVarType_Fieldname
        - Field types would be items like checkboxes, simple line inputs like names or addresses, comples inputs like long form strings or tables with dheckboxes nested within.
        - Field Types should be shortened to be easily understandable but save space and text
        - The FieldVarType is just the variable type of the field and can range from string to bool
        - An example is: "Option 1 [ ] Option 2 []" -> "$check_bool_Option1, $check_bool_Option2"
        Once a placeholder name is determined I would like you to input the placeholder value into the original document where the value would be (ex: [$string_name_ mail]), and then return the original document witht the correct placeholder values inputted.

        If the information needed is not available or unclear from the user's query, respond with "Information missing."

        Here is the document to analyze:

        {document}
        """.format(document=document)
        
        # User query
        query = "Your task is to analyze a document and create placeholder variables for different fillable field types"
        
        # Call Ollama (chat model) with the updated system prompt and user query
        response = chat(model=self.model_name, messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": query}
        ])

        # Parse and print the response
        
        response_text = response['message']['content']
        print(response_text)

        # # If needed, parse response JSON
        # try:
        #     parsed_response = json.loads(response_text)
        #     print("Parsed Function Call:", parsed_response)
        # except json.JSONDecodeError:
        #     print("Failed to parse response as JSON."

    def send_prompt(self, prompt: str, log_response: bool):
        response = chat(model=self.model_name, messages=[{"role": "user", "content": prompt}])
        print(response['message']['content'])

        if log_response:
            self.log_model_response(self.model_name, response.model_dump_json())

    def log_model_response(self, json_dump: str):
        log_filename = os.path.join(self.target_dir, f"{self.model_name}_responses.jsonl")

        # Ensure the target directory exists
        os.makedirs(self.target_dir, exist_ok=True)

        # Append formatted JSON to file
        with open(log_filename, "a") as f:
            f.write(json.dumps(json.loads(json_dump)) + "\n")

        return log_filename
            
            


    # stream = chat(
    #     model='llama3.2',
    #     messages=[{'role': 'user', 'content': 'Why is the sky blue?'}],
    #     stream=True,
    # )

    # for chunk in stream:
    #   print(chunk['message']['content'], end='', flush=True)

if __name__ == "__main__":
    path = 'C:/Capstone/Capstone_2025/pdf_reader_src/response_dumps'
    model = 'llama3.2'

    llama = Llama(path, model)

    prompt = 'What is 2 + 2?'
    # llama.send_prompt(model, prompt, True)
    # llama.test()