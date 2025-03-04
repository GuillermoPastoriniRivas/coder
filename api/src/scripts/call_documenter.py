from aidoc import AIDocumenter
import argparse
api_key = "sk-proj-iZUIWIoul2uPT3Si0x1DT3BlbkFJ0fSNIi1EVUCjp5ReYkJu"

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--project", required=True)
    parser.add_argument("--config", required=True)
    args = parser.parse_args()

    carpeta_proyecto = args.project
    json_path = args.config
    
    documenter = AIDocumenter(
        api_key=api_key,
        code_path=carpeta_proyecto,
        output_file=json_path
    )

    documenter.generate_documentation()

if __name__ == "__main__":
    main()