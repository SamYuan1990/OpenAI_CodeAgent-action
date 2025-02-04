# this is a poc for another tool which basing on SBOM to generate deployment suggestion for your pod.

# Step 1
Generate SBOM for your project
```shell
 syft scan . -o cyclonedx-json  > sbom.json 
```

# Step 2
Generate CVE scan result for your project
```shell
bomber scan ./sbom.json --output=json --debug > cve.json
```

# Step 3
This project will go through the CVEs and provide you with pod deployment suggestion.

# Step 4
If you have a pod deployment yaml, this project will ask Deep Seek to provide you suggestion if there any risk.