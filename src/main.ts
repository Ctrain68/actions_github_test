import * as core from '@actions/core'
import * as fs from 'fs'
import { exec } from 'async-shelljs'

const folderstoCheck: string[] = core.getInput("folders").split(",")
const isBackend = (n: string) => !(n.endsWith('portal') || n == 'va-customer')
const compareItems = (a: Item, b: Item) =>  
  a.TYPE == b.TYPE && a.IMAGE_NAME == b.IMAGE_NAME
  
interface Item {
  TYPE: string  
  IMAGE_NAME: string  
  BACKEND: boolean}

const run = (folders: string[]) => {
  // Changed  
  let changedFiles = exec('git diff --dirstat=files,0 HEAD~1', {
    silent: true  
  }).toString()

  let regexp = new RegExp(`(${folders.join('|')})/([\\w-]+)/`, 'g')

  let matches: Item[] = [...changedFiles.matchAll(regexp)].map(x => ({
    TYPE: x[1],
    IMAGE_NAME: x[2],
    BACKEND: isBackend(x[2])
  }))

  let changed: Item[] = matches.filter(
    (v, i, a) => i == a.findIndex(x => compareItems(x, v))
  )

  // Unchanged  
  let allFolders: Item[] = []
  for (let base of folders) {
    let files = fs.readdirSync(base)
    let mapped: Item[] = files.map(f => ({
      TYPE: base,
      IMAGE_NAME: f,
      BACKEND: isBackend(f)
    }))
    allFolders.push(...mapped)
  }

  let unchanged: Item[] = allFolders.filter(
    a => !changed.find(x => compareItems(a, x))
  )


  return [{changed}, {unchanged}]
}

let blah = run(folderstoCheck)


console.log('Folders that have changed to be built')

console.log(blah[0])

let output_1 = JSON.stringify(blah[0])

let output_2 = JSON.stringify(blah[1])

console.log('Folders that have not changed to be retagged')

console.log(output_1)

console.log(output_2)


core.setOutput('to_build', output_1 )
core.setOutput('to_retag', output_2 )