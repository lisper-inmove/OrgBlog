import * as orga from 'orga';
import * as fs from 'fs/promises';

import { Box, Typography } from '@mui/material';

import { Header } from '@/models/post';
import { Property } from '@/models/post';
import { Constants } from '@/utils/constants';

import HeaderParser from './HeaderParser';
import CodeParser from './CodeParser';
import Table from './TableParser';
import List from './ListParser';
import VerseParser from './VerseParser';
import ParagraphParser from './ParagraphParser';
import QuoteParser from './QuoteParser';
import ContentComponent from './ContentCompontent';
import ImageParser from './ImageParser';
import { extractSubstring } from '@/utils/common';
import { encodeBase64 } from '@/utils/common';
import { ItemValue } from '@/models/post';
import { ParagraphItem } from '@/models/post';
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
      // await fs.writeFile("/home/inmove/blog-test.json", contentJson, "utf-8");

      // 读取 OrgMode 文件内容
      const content = await fs.readFile(this.filePath, 'utf-8');
      // 使用 orga 解析内容
      this.ast = orga.parse(content);
      this.readProperty();
      this.start();
      return <div>
        <ContentComponent 
          components={this.components}
          headers={this.headers} 
          property={this.property}
        />
      </div>

    } catch (error) {
      console.error('Error reading or parsing OrgMode file:', error);
    }

    return (<div>Error</div>);
  }

  private start() {
    for (let children of this.ast.children) {
      // 一级Title
      if (children.type == "section") {
        this.parseSection(children);
      }
    }
  }

  private parseSection(obj: any) {

    let section: any[] = [];

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
    // section.push(<HeaderParser header={header} />);
    this.components.push(section);

    let prev; 
    for (let [index, _c] of obj.children.slice(1).entries()) {
      if (_c.type == "section") {
        this.parseSection(_c);
      } else if (_c.type == "block" && _c.name.toLowerCase() == "src") {
        if (prev && prev.type == "keyword" && prev.key == "NAME") {
          section.push(this.parseCode(_c, prev.value));
        } else {
          section.push(this.parseCode(_c, ""));
        }
      } else if (_c.type == "table") {
        // 因为使用了slice(1)，所以使用 index, 而不是inde - 1
        section.push(this.parseTable(_c, obj.children[index]));
      } else if (_c.type == "list") {
        let items: ListItem[] = [];
        this.parseList(_c.children, items, 0);
        section.push(<List ordered={_c.ordered} items={items} />);
      } else if (_c.type == "block" && _c.name == "verse") {
        section.push(this.parseVerse(_c));
      } else if (_c.type == "link") {
        let linkCom = this.parseLinkNotInParagraph(_c, prev);
        if (linkCom) {
          section.push(linkCom);
        }
      } else if (_c.type == "paragraph") {
        section.push(this.parseParagraph(_c));
      } else if (_c.type == "block" && _c.name.toLowerCase() == "quote") {
        section.push(this.parseQuote(_c));
      } else if (_c.type == "keyword" && _c.key == "RESULTS") {
        // section.push(this.parseResult(_c));
      }
      prev = _c;
    }

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

  private parseCode(obj: any, filename: string) {
    for (const [index, param] of obj.params.entries()) {
      if (param == ":noweb" && obj.params[index + 1].toLowerCase() == "yes") {
        return;
      }
    }
    let language = obj.params[0];
    // this.components.push(<CodeParser line={obj.value} language={language} />);
    return <CodeParser line={obj.value} language={language} filename={filename} />;
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
    return <Table data={data} caption={caption} />;
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
    } else if (item.type == "link") {
      cur.items.push(this.parseLink(item));
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
    return <VerseParser verse={verse} />;
  }

  private parseParagraph(obj: any) {
    let paragraph: Paragraph = {
      items: [] as ParagraphItem[],
    };
    for (let [index, item] of obj.children.entries()) {
      if (item.type == "text") {
        paragraph.items.push({
          style: item.style,
          value: item.value,
          indent: 0,
          type: item.type,
        });
      } else if (item.type == "link") {
        paragraph.items.push(this.parseLink(item));
      } else if (item.type == "newline") {
        paragraph.items.push({
          style: item.style,
          value: '\n',
          indent: 0,
          type: item.type,
        });
      }
    }
    // 去掉最后一个换行
    paragraph.items.pop();
    return <ParagraphParser paragraph={paragraph} />;
  }

  private parseLink(obj: any) {
    let value = "";
    if (obj.path.protocol == "https" || obj.path.protocol == "http") { 
      value = obj.children[2].value + "||" + obj.children[1].value;
    } else if (obj.path.protocol == "file" && obj.path.value.endsWith(".org")) {
      let fileAbsPath = obj.children[1].value;
      let filepath = fileAbsPath.slice(fileAbsPath.indexOf("posts"));
      let url = encodeBase64(filepath);
      value = obj.children[2].value + "||" + url;
    }
    return {
      style: "link",
      value: value,
      indent: 0,
      type: obj.item,
    };
  }

  private parseLinkNotInParagraph(obj: any, prev: any) {
    if (obj.attributes && obj.attributes.attr_html && obj.attributes.attr_html.image == 't') {
      return <ImageParser link={obj.children[1].value} />
    }
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
    return <QuoteParser quotes={quotes} />;
  }

  private parseResult(obj: any) {
    return <div className="pl-5 pb-2 pt-1"
        style={{
            backgroundColor: Constants.codeBlockBgColor,
          }}
      >
      Results:<br />
      &nbsp;&nbsp;&gt;&gt; {obj.value}
    </div>
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
