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
	"os"
	"path/filepath"
	"strings"

	"golang.org/x/tools/cover"
)

// FunctionInfo 存储函数的相关信息
type FunctionInfo struct {
	Name         string `json:"functionName"`   // 函数名
	File         string `json:"fileName"`       // 函数所在文件
	HasTestCover bool   `json:"isCovered"`      // 是否有单元测试覆盖
	HasGoDoc     bool   `json:"hasComment"`     // 是否有 Go Doc 文档
	Content      string `json:"content"`        // 函数内容
	GoDocContent string `json:"commentContent"` // Go Doc 内容
}

func parseDirRecursive(fset *token.FileSet, dir string) (map[string]*ast.Package, error) {
	pkgs := make(map[string]*ast.Package)

	// 遍历目录
	err := filepath.Walk(dir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		// 跳过非 Go 文件
		if info.IsDir() || filepath.Ext(path) != ".go" {
			return nil
		}

		// 解析 Go 文件
		f, err := parser.ParseFile(fset, path, nil, parser.ParseComments)
		if err != nil {
			return fmt.Errorf("failed to parse file %s: %w", path, err)
		}

		// 获取包名
		pkgName := f.Name.Name

		// 如果包不存在，则初始化
		if _, ok := pkgs[pkgName]; !ok {
			pkgs[pkgName] = &ast.Package{
				Name:  pkgName,
				Files: make(map[string]*ast.File),
			}
		}

		// 将文件添加到包中
		pkgs[pkgName].Files[path] = f

		return nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to walk directory %s: %w", dir, err)
	}

	return pkgs, nil
}

func main() {

	args := os.Args
	// 1. 解析覆盖率文件
	codeDir := args[1] // 替换为你的代码目录

	coverageFile := codeDir + "/coverage.out" // 替换为你的覆盖率文件路径
	profiles, err := cover.ParseProfiles(coverageFile)
	if err != nil {
		fmt.Printf("Failed to parse coverage file: %v\n", err)
		return
	}

	// 2. 解析代码目录
	fset := token.NewFileSet()
	pkgs, err := parseDirRecursive(fset, codeDir)
	if err != nil {
		fmt.Printf("Failed to parse code directory: %v\n", err)
		return
	}

	// 3. 提取 Go Doc 文档

	// 4. 遍历 AST，构建函数信息
	var functions []FunctionInfo
	for _, pkg := range pkgs {
		fmt.Println(pkg.Files)
		docPkg := doc.New(pkgs[pkg.Name], codeDir, doc.AllDecls) // 替换 "main" 为你的包名
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
	// 创建或打开文件
	// 如果文件不存在，会创建文件；如果文件存在，会覆盖文件内容（因为使用了 os.O_CREATE | os.O_WRONLY | os.O_TRUNC 标志）
	file, err := os.OpenFile(codeDir+"/golangAST.json", os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0644)
	if err != nil {
		fmt.Println("Error opening file:", err)
		return
	}
	defer file.Close() // 确保在函数返回前关闭文件

	// 向文件写入内容
	_, err = file.WriteString(string(jsonData))
	if err != nil {
		fmt.Println("Error writing to file:", err)
	} else {
		fmt.Println("Successfully wrote to the file.")
	}
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
