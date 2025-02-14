package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"go/ast"
	"go/doc"
	"go/parser"
	"go/printer"
	"go/token"
	"strings"

	"golang.org/x/tools/cover"
)

// FunctionInfo 存储函数的相关信息
type FunctionInfo struct {
	Name         string `json:"name"`           // 函数名
	File         string `json:"file"`           // 函数所在文件
	HasTestCover bool   `json:"has_test_cover"` // 是否有单元测试覆盖
	HasGoDoc     bool   `json:"has_go_doc"`     // 是否有 Go Doc 文档
	Content      string `json:"content"`        // 函数内容
	GoDocContent string `json:"go_doc_content"` // Go Doc 内容
}

func main() {
	// 1. 解析覆盖率文件
	coverageFile := "coverage.out" // 替换为你的覆盖率文件路径
	profiles, err := cover.ParseProfiles(coverageFile)
	if err != nil {
		fmt.Printf("Failed to parse coverage file: %v\n", err)
		return
	}

	// 2. 解析代码目录
	codeDir := "." // 替换为你的代码目录
	fset := token.NewFileSet()
	pkgs, err := parser.ParseDir(fset, codeDir, nil, parser.ParseComments)
	if err != nil {
		fmt.Printf("Failed to parse code directory: %v\n", err)
		return
	}

	// 3. 提取 Go Doc 文档
	docPkg := doc.New(pkgs["main"], codeDir, doc.AllDecls) // 替换 "main" 为你的包名

	// 4. 遍历 AST，构建函数信息
	var functions []FunctionInfo
	for _, pkg := range pkgs {
		for filePath, file := range pkg.Files {
			ast.Inspect(file, func(n ast.Node) bool {
				if fn, ok := n.(*ast.FuncDecl); ok {
					// 获取函数名
					funcName := fn.Name.Name

					// 获取函数内容
					var funcContent bytes.Buffer
					printer.Fprint(&funcContent, fset, fn)

					// 检查是否有单元测试覆盖
					hasTestCover := hasTestCoverage(filePath, funcName, profiles)

					// 检查是否有 Go Doc 文档
					hasGoDoc, goDocContent := hasGoDoc(funcName, docPkg)

					// 添加到函数列表
					functions = append(functions, FunctionInfo{
						Name:         funcName,
						File:         filePath,
						HasTestCover: hasTestCover,
						HasGoDoc:     hasGoDoc,
						Content:      funcContent.String(),
						GoDocContent: goDocContent,
					})
				}
				return true
			})
		}
	}

	// 5. 输出 JSON
	jsonData, err := json.MarshalIndent(functions, "", "  ")
	if err != nil {
		fmt.Printf("Failed to generate JSON: %v\n", err)
		return
	}
	fmt.Println(string(jsonData))
}

// hasTestCoverage 检查函数是否有单元测试覆盖
func hasTestCoverage(filePath, funcName string, profiles []*cover.Profile) bool {
	for _, profile := range profiles {
		if strings.HasSuffix(profile.FileName, filePath) {
			for _, block := range profile.Blocks {
				if block.Count > 0 {
					return true
				}
			}
		}
	}
	return false
}

// hasGoDoc 检查函数是否有 Go Doc 文档
func hasGoDoc(funcName string, docPkg *doc.Package) (bool, string) {
	for _, fn := range docPkg.Funcs {
		if fn.Name == funcName {
			return true, fn.Doc
		}
	}
	return false, ""
}
