
{ 'abc_class': 'AbcFile'
, 'minor_version': 16
, 'major_version': 46
, 'int_pool': [ 
              , '10'
              , '0'
              , '1' ]
, 'uint_pool': [  ]
, 'double_pool': [  ]
, 'utf8_pool': [ 
               , ''
               , 'Object'
               , 'Array'
               , 'RegExp'
               , 'x'
               , 'print' ]
, 'namespace_pool': [ 
                    , { 'kind': 'PackageNamespace'
                      , 'utf8': '1' }
                    , { 'kind': 'AnonymousNamespace'
                      , 'utf8': '1' } ]
, 'nsset_pool': [ 
                , [ '2' ] ]
, 'name_pool': [ 
               , { 'kind': 'QName'
                 , 'ns': '1'
                 , 'utf8': '2' }
               , { 'kind': 'QName'
                 , 'ns': '1'
                 , 'utf8': '3' }
               , { 'kind': 'QName'
                 , 'ns': '1'
                 , 'utf8': '4' }
               , { 'kind': 'QName'
                 , 'ns': '2'
                 , 'utf8': '5' }
               , { 'kind': 'Multiname'
                 , 'utf8': '5'
                 , 'nsset': '1' }
               , { 'kind': 'Multiname'
                 , 'utf8': '6'
                 , 'nsset': '1' } ]
, 'method_infos': [ { 'ret_type': 
                    , 'param_types': []
                    , 'name': 
                    , 'flags': 
                    , 'optional_count': 
                    , 'value_kind': [  ]
                    , 'param_names': [  ] }
                  ,  ]
, 'method_bodys': [ { 'method_info': 
                    , 'max_stack': 
                    , 'max_regs': 
                    , 'scope_depth': 
                    , 'max_scope': 
                    , 'code': [ getlocal0
                              , pushscope
                              , findproperty 04
                              , pushint 01
                              , setproperty 04
                              , pushundefined
                              , pop
                              , jump 00 00 00
                              , label
                              , findpropstrict 05
                              , getproperty 05
                              , pushint 02
                              , greaterthan
                              , iffalse 00 00 00
                              , findpropstrict 06
                              , getproperty 06
                              , pushnull
                              , findpropstrict 05
                              , getproperty 05
                              , call 01
                              , pop
                              , findproperty 05
                              , findpropstrict 05
                              , getproperty 05
                              , pushint 03
                              , subtract
                              , dup
                              , setlocal1
                              , setproperty 05
                              , getlocal1
                              , kill 01
                              , pop
                              , jump 00 00 00
                              , jump 00 00 00
                              , pushtrue
                              , iftrue ca ff ff
                              , findpropstrict 06
                              , getproperty 06
                              , pushnull
                              , pushtrue
                              , call 01
                              , pop
                              , returnvoid
                              ,  ]
                    , 'exceptions': [  ]
                    , 'fixtures': [  ] }
                  ,  ] }