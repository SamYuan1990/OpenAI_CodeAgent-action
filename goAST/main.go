package main

import (
	"encoding/json"
	"fmt"
	"go/ast"
	"go/doc"
	"go/parser"
	"go/token"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"golang.org/x/tools/cover"
)

// FunctionInfo 存储函数的相关信息
type FunctionInfo struct {
	Name         string `json:"functionname"`   // 函数名
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

		if strings.Contains(path, "vendor") {
			return nil
		}

		// 解析 Go 文件
		f, err := parser.ParseFile(fset, path, nil, parser.ParseComments)
		if err != nil {
			return fmt.Errorf("failed to parse file %s: %v", path, err)
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
		return nil, fmt.Errorf("failed to walk directory %s: %v", dir, err)
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
		//fmt.Println(pkg.Files)
		docPkg := doc.New(pkgs[pkg.Name], codeDir, doc.AllDecls)

		for filePath, file := range pkg.Files {
			// 读取文件内容
			fileContent, err := os.ReadFile(filePath)
			if err != nil {
				fmt.Printf("Failed to read file %s: %v\n", filePath, err)
				continue
			}

			// 使用改进后的函数体提取逻辑
			bodyInfos, err := GetFunctionBodies(fileContent)
			if err != nil {
				fmt.Printf("Failed to parse functions in %s: %v\n", filePath, err)
				continue
			}

			// 创建函数体查找映射（处理潜在的重名情况）
			bodyMap := make(map[string]string)
			for _, info := range bodyInfos {
				// 如果存在重名函数，保留最后一个（根据实际需求调整）
				bodyMap[info.Name] = info.Body
			}

			// 遍历文件的所有声明
			for _, decl := range file.Decls {
				if fn, ok := decl.(*ast.FuncDecl); ok {
					funcName := fn.Name.Name

					// 从预先生成的bodyMap中获取内容
					funcContent, exists := bodyMap[funcName]
					if !exists {
						fmt.Printf("Function %s body not found in %s\n", funcName, filePath)
						continue
					}
					// 获取函数的起始和结束位置
					start := fset.Position(fn.Pos()).Offset
					end := fset.Position(fn.End()).Offset

					// 从文件内容中提取整个函数
					pre_funcContent := string(fileContent[start:end])
					funcContent = pre_funcContent + " " + funcContent

					// 检查测试覆盖和文档（保持原有逻辑）
					hasTestCover := hasTestCoverage(filePath, funcName, profiles)
					hasGoDoc, goDocContent := hasGoDoc(funcName, docPkg)

					// 添加到结果集
					functions = append(functions, FunctionInfo{
						Name:         funcName,
						File:         filePath,
						HasTestCover: hasTestCover,
						HasGoDoc:     hasGoDoc,
						Content:      funcContent,
						GoDocContent: goDocContent,
					})
				}
			}
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

// FunctionBodyInfo 存储函数名及其对应的函数体内容
type FunctionBodyInfo struct {
	Name string
	Body string
}

// GetFunctionBodies 解析文件内容并返回所有函数的体内容
func GetFunctionBodies(src []byte) ([]FunctionBodyInfo, error) {
	fset := token.NewFileSet()
	file, err := parser.ParseFile(fset, "", src, parser.ParseComments)
	if err != nil {
		return nil, err
	}

	// 收集所有函数声明
	var funcDecls []*ast.FuncDecl
	ast.Inspect(file, func(n ast.Node) bool {
		if fn, ok := n.(*ast.FuncDecl); ok {
			funcDecls = append(funcDecls, fn)
		}
		return true
	})

	// 按函数在源代码中的位置排序
	sort.Slice(funcDecls, func(i, j int) bool {
		return fset.Position(funcDecls[i].Pos()).Offset < fset.Position(funcDecls[j].Pos()).Offset
	})

	fileEnd := fset.Position(file.End()).Offset
	results := make([]FunctionBodyInfo, 0, len(funcDecls))

	for i, fn := range funcDecls {
		var bodyContent string
		if fn.Body != nil {
			// 有Body时直接提取
			start := fset.Position(fn.Body.Pos()).Offset
			end := fset.Position(fn.Body.End()).Offset
			bodyContent = string(src[start:end])
		} else {
			// 无Body时根据相邻函数位置或文件末尾提取
			start := fset.Position(fn.Pos()).Offset
			var end int
			if i < len(funcDecls)-1 {
				end = fset.Position(funcDecls[i+1].Pos()).Offset
			} else {
				end = fileEnd
			}
			bodyContent = string(src[start:end])
		}

		// 获取函数名
		funcName := fn.Name.Name
		results = append(results, FunctionBodyInfo{
			Name: funcName,
			Body: bodyContent,
		})
	}

	return results, nil
}
