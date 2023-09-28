import * as orga from 'orga';
import * as fs from 'fs/promises';

import { Box, Typography } from '@mui/material';

import { Header } from '@/models/post';
import { Property } from '@/models/post';
import { Constants } from '@/utils/constants';

import HeaderParser from './HeaderParser';
import CodeParser from './CodeParser';
import TableContent from './TableContent';
import Table from './TableParser';
import List from './ListParser';
import VerseParser from './VerseParser';
import ParagraphParser from './ParagraphParser';
import QuoteParser from './QuoteParser';
import { ItemValue } from '@/models/post';
import { ListItem } from '@/models/post';
import { Verse } from '@/models/post';
import { Paragraph } from '@/models/post';
import { Quote } from '@/models/post';

class OrgParser {

  private filePath: string;
  private ast: any;
  private headers: Header[] = [];
  private property: Property = {
    title: "",
    subtitle: "",
    createDate: new Date(),
    updateDate: new Date(),
    category: "",
  };
  private components: any[] = [];

  public constructor(filePath: string) {
    this.filePath = filePath;
  }

  public async parse() {
    try {

      // TODO: 保存生成的Json格式的文件用于调试
      // const contentForSave = await fs.readFile(this.filePath, 'utf-8');
      // let ast = orga.parse(contentForSave);
      // const contentJson = JSON.stringify(ast, null, 2);
      // await fs.writeFile("/home/inmove/source-code/blog-v2/posts/gRPC/python-grpc.json", contentJson, "utf-8");

      // 读取 OrgMode 文件内容
      const content = await fs.readFile(this.filePath, 'utf-8');
      // 使用 orga 解析内容
      this.ast = orga.parse(content);
      // this.start();
      return this.getContentComponent();

    } catch (error) {
      console.error('Error reading or parsing OrgMode file:', error);
    }

    return (<div>Error</div>);
  }

  private getContentComponent() {
    this.readProperty();
    this.start();
    return (
      <div>
      <TableContent headers={this.headers}/>
      <Box style={{
          color: Constants.postTextColor,
        }}>
        {this.components.map((component) => component)}
      </Box>
      </div>
    );
  }

  private start() {
    this.readProperty();
    for (let children of this.ast.children) {
      // 一级Title
      if (children.type == "section") {
        this.parseSection(children);
      }
    }
  }

  private parseSection(obj: any) {
    const header = {
      level: obj.level,
      name: "",
      tags: [],
      index: "",
    };

    let c = obj.children[0];
    for (let [index, _c] of c.children.entries()) {
      if (_c.type == "text") {
        header.name = _c.value;
      } else if (_c.type == "tags") {
        header.tags = _c.tags;
      }
    }

    this.headers.push(header);
    this.setHeaderIndex();
    this.components.push(<HeaderParser header={header} />);

    for (let [index, _c] of obj.children.slice(1).entries()) {
      if (_c.type == "section") {
        this.parseSection(_c);
      } else if (_c.type == "block" && _c.name.toLowerCase() == "src") {
        this.parseCode(_c);
      } else if (_c.type == "table") {
        // 因为使用了slice(1)，所以使用 index, 而不是inde - 1
        this.parseTable(_c, obj.children[index]);
      } else if (_c.type == "list") {
        let items: ListItem[] = [];
        this.parseList(_c.children, items, 0);
        this.components.push(<List ordered={_c.ordered} items={items} />);
      } else if (_c.type == "block" && _c.name == "verse") {
        this.parseVerse(_c);
      } else if (_c.type == "paragraph") {
        this.parseParagraph(_c);
      } else if (_c.type == "block" && _c.name.toLowerCase() == "quote") {
        this.parseQuote(_c);
      }
    }

    this.components.push(<div style={{marginBottom: "20px"}}></div>);
  }

  private setHeaderIndex() {
    let header = this.headers[this.headers.length - 1];
    if (this.headers.length == 1) {
      header.index = "1";
    } else {
      let prevHeader = this.headers[this.headers.length - 2];
      header.index = this.getHeaderIndexHelper(prevHeader.index, header.level, prevHeader.level);
    }
  }

  private getHeaderIndexHelper(prev: string, curLevel: number, prevLevel: number) {
    let prevIndex = prev.split(".");
    let lastPart = prevIndex[prevIndex.length - 1];
    let index = '-1';
    if (curLevel == prevLevel) {
      // 兄弟
      prevIndex[prevIndex.length - 1] = (parseInt(lastPart) + 1).toString();
      index = prevIndex.join(".");
    } else if (curLevel - prevLevel == 1) {
      // 儿子
      index = prev + '.1';
    } else if (curLevel - prevLevel <= -1) {
      // 叔叔
      let diff = prevLevel - curLevel;
      for (let i = 0; i < diff; i++) {
        prevIndex.pop();
      }
      lastPart = prevIndex[prevIndex.length - 1];
      prevIndex[prevIndex.length - 1] = (parseInt(lastPart) + 1).toString();
      index = prevIndex.join(".");
    }
    return index;
  }

  private parseCode(obj: any) {
    for (const [index, param] of obj.params.entries()) {
      if (param == ":noweb" && obj.params[index + 1].toLowerCase() == "yes") {
        return;
      }
    }
    let language = obj.params[0];
    this.components.push(<CodeParser line={obj.value} language={language} />);
  }

  private parseTable(obj: any, prev: any) {
    let caption = "";
    if (prev.type == "keyword" && prev.key == "NAME") {
      caption = prev.value;
    }
    let data: any[][] = [];
    for (let _row of obj.children) {
      if (_row.type != "table.row") {
        continue;
      }
      let row: any[] = [];
      if (_row.children) {
        for (let _col of _row.children) {
          if (_col.type == "table.cell") {
            for (let _cell of _col.children) {
              if (_cell.type == "text") {
                row.push(_cell.value);
              }
            }
          }
        }
      }
      data.push(row);
    }
    this.components.push(<Table data={data} caption={caption} />);
  }

  private parseListItem(item: any, cur: ListItem) {
    if (item.type == "list.item.bullet") {
      return;
    }
    if (item.type == "text") {
      cur.items.push({
        value: item.value,
        style: item.style,
        indent: 0,
      });
    }
  }

  private parseList(obj: any, items: ListItem[], level: number) {
    let i = 1;
    let boldContent = "";
    for (let [index, item] of obj.entries()) {
      if (item.type == "list.item") {
        let curItem: ListItem = {
          items: [] as ItemValue[],
          level: level,
          index: i,
        };
        for (let [_index, _item] of item.children.entries()) {
          this.parseListItem(_item, curItem);
        }
        i += 1;
        items.push(curItem);
      } else if (item.type == "list") {
        this.parseList(item.children, items, level + 1);
      }
    }
  }

  private parseVerse(obj: any) {
    let verse: Verse[] = [];
    verse.push({
      items: [] as ItemValue[],
    });
    let curVerse = verse[verse.length - 1];
    // TODO: 将verse中的list与 单独的 List合并处理
    // 因为解析出来的 verse中的list，没有 type=list这个块。直接就是 list.item.bullet，后面接一个text
    let listItemIndex = -1;
    for (let [index, item] of obj.children.entries()) {
      if (item.type == "text") {
        curVerse.items.push({
          style: item.style,
          value: item.value,
          indent: item.indent,
        });
      } else if (item.type == "list.item.bullet") {
        // TODO: 关于verse中的列表，处理有点麻烦，结构上不能很好的划分。目前只能处理成无序列表
        curVerse.items.push({
          style: "li",
          value: '-',
          indent: item.indent + 1
        });
      } else if (item.type == "newline") {
        verse.push({
          items: [] as ItemValue[],
        });
        curVerse = verse[verse.length - 1];
        listItemIndex = -1;
      }
    }
    this.components.push(<VerseParser verse={verse} />);
  }

  private parseParagraph(obj: any) {
    let paragraph: Paragraph = {
      items: [] as ItemValue[],
    };
    for (let [index, item] of obj.children.entries()) {
      if (item.type == "text") {
        paragraph.items.push({
          style: item.style,
          value: item.value,
          indent: 0,
        });
      } else if (item.type == "newline") {
        paragraph.items.push({
          style: item.style,
          value: '\n',
          indent: 0,
        });
      }
    }
    // 去掉最后一个换行
    paragraph.items.pop();
    this.components.push(<ParagraphParser paragraph={paragraph} />);
  }

  private parseQuote(obj: any) {
    let quotes: Quote[] = [];
    for (let [index, item] of obj.children.entries()) {
      if (item.type == "block.begin" || item.type == "newline") {
        quotes.push({
          items: [] as ItemValue[],
        });
      }
      if (item.type == "text") {
        quotes[quotes.length - 1].items.push({
          style: item.style,
          value: item.value,
          indent: 0,
        });
      }
    }
    // 最后一定有一个换行符，但是后面是没有数据的了
    quotes.pop();
    this.components.push(<QuoteParser quotes={quotes} />);
  }

  private readProperty() {
    this.property.title = this.ast.properties.title;
    this.property.subtitle = this.ast.subtitle;
    this.property.category = this.ast.category;
  }

  public getAst() {
    return this.ast;
  }
  public getProperty() {
    return this.property;
  }
}

export default OrgParser;
